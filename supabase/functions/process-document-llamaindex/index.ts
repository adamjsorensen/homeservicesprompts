
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders } from "../_shared/cors.ts";
import { generateEmbedding } from "../_shared/openai.ts";
import { getDocumentProcessor } from "../_shared/file-processors.ts";
import { withRetry } from "../_shared/retry.ts";

interface DocumentInput {
  title: string;
  content: string;
  fileType: string;
  hubAreas: string[];
  metadata?: Record<string, any>;
  isBase64?: boolean;
}

// Text chunking with smart sentence boundaries
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + chunkSize, text.length);
    
    // If we're not at the end and not at the first chunk, try to find a good break point
    if (endIndex < text.length && startIndex > 0) {
      // Look for a period, question mark, or exclamation followed by a space or newline
      const breakPointRegex = /[.?!]\s+/g;
      let matches;
      let lastMatch = null;
      
      // Find the last sentence break within our window
      while ((matches = breakPointRegex.exec(text.substring(startIndex, endIndex))) !== null) {
        lastMatch = matches;
      }
      
      if (lastMatch) {
        endIndex = startIndex + lastMatch.index + 2; // +2 to include the punctuation and space
      }
    }
    
    chunks.push(text.substring(startIndex, endIndex));
    
    // Move the start index for the next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    if (startIndex < 0) startIndex = 0;
  }
  
  return chunks;
}

// Process document and generate chunks
async function processDocument(
  supabaseClient: any, 
  documentId: string, 
  content: string, 
  chunkSize: number = 1000, 
  overlap: number = 200,
  batchId?: string
): Promise<{ success: boolean; chunks_count: number; error?: string }> {
  try {
    // Split text into chunks
    const chunks = chunkText(content, chunkSize, overlap);
    console.log(`Document split into ${chunks.length} chunks`);
    
    // Create batch status record if batchId is provided
    if (batchId) {
      await supabaseClient
        .from('batch_processing_status')
        .upsert({
          batch_id: batchId,
          total_items: chunks.length,
          processed_items: 0,
          status: 'processing'
        });
    }
    
    // Process each chunk and generate embeddings
    let successCount = 0;
    const chunkIds = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding for chunk with retry
        console.log(`Generating embedding for chunk ${i+1}/${chunks.length}`);
        const embedding = await generateEmbedding(chunk);
        
        // Store chunk in database
        const { data: chunkData, error } = await supabaseClient
          .from('document_chunks')
          .insert({
            document_id: documentId,
            content: chunk,
            chunk_index: i,
            embedding,
            metadata: { 
              chunk_size: chunkSize,
              overlap,
              position: i,
              total_chunks: chunks.length,
              processed_at: new Date().toISOString()
            }
          })
          .select();
        
        if (error) {
          console.error(`Error storing chunk ${i}:`, error);
          throw new Error(`Failed to store chunk ${i}: ${error.message}`);
        }
        
        chunkIds.push(chunkData[0].id);
        successCount++;
        
        // Update batch status
        if (batchId) {
          await supabaseClient
            .from('batch_processing_status')
            .update({
              processed_items: successCount,
              status: successCount === chunks.length ? 'completed' : 'processing'
            })
            .eq('batch_id', batchId);
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        // Continue processing other chunks despite the error
      }
    }
    
    // Create relationships between adjacent chunks
    for (let i = 0; i < chunkIds.length - 1; i++) {
      try {
        // Create the relationship
        const { error } = await supabaseClient
          .from('node_relationships')
          .insert({
            parent_chunk_id: chunkIds[i],
            child_chunk_id: chunkIds[i + 1],
            relationship_type: 'sequential'
          });
        
        if (error) {
          console.error(`Error creating relationship between chunks ${i} and ${i+1}:`, error);
        }
      } catch (error) {
        console.error(`Error creating relationship:`, error);
      }
    }
    
    // Create initial document version record
    await supabaseClient
      .from('document_versions')
      .insert({
        document_id: documentId,
        version: 1,
        changes: { 
          action: 'created', 
          chunks_count: chunks.length,
          successful_chunks: successCount
        }
      });
    
    return { 
      success: successCount > 0, 
      chunks_count: successCount 
    };
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update batch status if there's a fatal error
    if (batchId) {
      await supabaseClient
        .from('batch_processing_status')
        .update({
          status: 'error',
          metadata: { error: error.message }
        })
        .eq('batch_id', batchId);
    }
    
    return { 
      success: false, 
      chunks_count: 0, 
      error: error.message 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  // Generate a unique batch ID for tracking
  const batchId = crypto.randomUUID();
  const processingStartTime = performance.now();
  
  try {
    const { title, content, fileType, hubAreas, metadata, isBase64 = false } = await req.json() as DocumentInput;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Processing document: ${title} (${fileType})`);
    
    // Process document content based on file type
    const documentProcessor = getDocumentProcessor(fileType);
    const processedDocument = await withRetry(async () => {
      if (isBase64) {
        return await documentProcessor(content, metadata || {});
      } else {
        return await documentProcessor(content, metadata || {});
      }
    });
    
    // Create document record with enhanced metadata
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title,
        content: processedDocument.text,
        file_type: fileType,
        hub_areas: hubAreas,
        metadata: {
          ...processedDocument.metadata,
          ...metadata,
          processor: 'llamaindex',
          processed_at: new Date().toISOString(),
          batch_id: batchId
        }
      })
      .select()
      .single();
    
    if (documentError) {
      throw new Error(`Failed to create document: ${documentError.message}`);
    }
    
    console.log(`Document created with ID: ${document.id}`);
    
    // Record processing start in batch status
    await supabase
      .from('batch_processing_status')
      .insert({
        batch_id: batchId,
        total_items: 0, // Will be updated by processDocument
        processed_items: 0,
        status: 'preparing',
        metadata: {
          document_id: document.id,
          title,
          file_type: fileType
        }
      });
    
    // Process document and create chunks
    const processingResult = await processDocument(
      supabase, 
      document.id, 
      processedDocument.text, 
      1000, // chunk size
      200,  // overlap
      batchId
    );
    
    if (!processingResult.success) {
      throw new Error(`Document processing failed: ${processingResult.error}`);
    }
    
    // Calculate and record performance metrics
    const processingDuration = performance.now() - processingStartTime;
    
    await supabase
      .from('performance_metrics')
      .insert({
        operation_type: 'document_processing',
        duration_ms: Math.round(processingDuration),
        status: 'success',
        document_count: 1,
        metadata: {
          document_id: document.id,
          chunks_count: processingResult.chunks_count,
          file_type: fileType,
          processing_time_ms: processingDuration
        }
      });
    
    return new Response(
      JSON.stringify({
        success: true,
        document_id: document.id,
        chunks_count: processingResult.chunks_count,
        batch_id: batchId,
        performance: {
          duration_ms: Math.round(processingDuration)
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    // Initialize Supabase client for error logging
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Record error metrics
      const processingDuration = performance.now() - processingStartTime;
      
      await supabase
        .from('performance_metrics')
        .insert({
          operation_type: 'document_processing',
          duration_ms: Math.round(processingDuration),
          status: 'error',
          error_message: error.message,
          metadata: {
            batch_id: batchId,
            error_details: error.stack
          }
        });
      
      // Update batch status
      await supabase
        .from('batch_processing_status')
        .upsert({
          batch_id: batchId,
          status: 'error',
          completed_at: new Date().toISOString(),
          metadata: { 
            error: error.message,
            error_details: error.stack
          }
        });
    } catch (loggingError) {
      console.error('Error logging failure:', loggingError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        batch_id: batchId
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
