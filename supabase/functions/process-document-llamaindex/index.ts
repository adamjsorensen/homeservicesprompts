
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders } from "../_shared/cors.ts";
import { processDocumentWithLlamaIndex, storeDocumentNodes } from "../_shared/llama-index.ts";

interface DocumentInput {
  title: string;
  content: string;
  fileType: string;
  hubAreas: string[];
  metadata?: Record<string, any>;
  isBase64?: boolean;
  processingOptions?: {
    chunkSize?: number;
    chunkOverlap?: number;
    splitByHeading?: boolean;
    hierarchical?: boolean;
  };
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
    // Environment variable validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const llamaindexApiKey = Deno.env.get('LLAMAINDEX_API_KEY');
    
    if (!supabaseUrl) throw new Error('SUPABASE_URL environment variable is not set');
    if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    if (!llamaindexApiKey) throw new Error('LLAMAINDEX_API_KEY environment variable is not set');
    
    // Log initialization status
    console.log("Edge function initialization:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasLlamaIndexKey: !!llamaindexApiKey,
      method: req.method,
      url: req.url
    });
    
    const { 
      title, 
      content, 
      fileType, 
      hubAreas, 
      metadata = {}, 
      isBase64 = false,
      processingOptions = {}
    } = await req.json() as DocumentInput;
    
    // Input validation
    if (!title) throw new Error('Document title is required');
    if (!content) throw new Error('Document content is required');
    if (!fileType) throw new Error('Document file type is required');
    if (!hubAreas || !Array.isArray(hubAreas)) throw new Error('Document hub areas must be an array');
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Processing document: ${title} (${fileType})`);
    
    // Create batch status record
    await supabase
      .from('batch_processing_status')
      .insert({
        batch_id: batchId,
        total_items: 0, // Will be updated later
        processed_items: 0,
        status: 'preparing',
        metadata: {
          document_id: null, // Will be updated once document is created
          title,
          file_type: fileType,
          processing_type: 'llamaindex'
        }
      });
    
    // Create document record first to get an ID
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title,
        content: "", // Will be updated with full content after processing
        file_type: fileType,
        hub_areas: hubAreas,
        metadata: {
          ...metadata,
          processor: 'llamaindex',
          processing_started_at: new Date().toISOString(),
          batch_id: batchId
        }
      })
      .select()
      .single();
    
    if (documentError) {
      throw new Error(`Failed to create document: ${documentError.message}`);
    }
    
    console.log(`Document created with ID: ${document.id}`);
    
    // Update batch status with document ID
    await supabase
      .from('batch_processing_status')
      .update({
        metadata: {
          ...metadata,
          document_id: document.id,
          title,
          file_type: fileType,
          processing_type: 'llamaindex'
        }
      })
      .eq('batch_id', batchId);
    
    // Process document using LlamaIndex
    console.log("Processing document with LlamaIndex...");
    const fileName = metadata.original_filename || `${title}.${fileType}`;
    const processedDoc = await processDocumentWithLlamaIndex(
      content,
      fileName,
      fileType,
      {
        chunkSize: processingOptions.chunkSize || 1000,
        chunkOverlap: processingOptions.chunkOverlap || 200,
        splitByHeading: processingOptions.splitByHeading !== false,
        hierarchical: processingOptions.hierarchical !== false
      }
    );
    
    console.log(`Document processed with ${processedDoc.chunks.length} chunks`);
    
    // Update batch status with total items
    await supabase
      .from('batch_processing_status')
      .update({
        total_items: processedDoc.chunks.length,
        status: 'processing'
      })
      .eq('batch_id', batchId);
    
    // Update document with processed content and metadata
    await supabase
      .from('documents')
      .update({
        content: processedDoc.chunks.map(chunk => chunk.text).join("\n\n"),
        metadata: {
          ...document.metadata,
          ...processedDoc.document_metadata,
          processing_metadata: processedDoc.processing_metadata,
          chunks_count: processedDoc.chunks.length,
          processor: 'llamaindex'
        }
      })
      .eq('id', document.id);
    
    // Store the document chunks with embeddings
    console.log("Storing document chunks and embeddings...");
    const enrichedChunks = processedDoc.chunks.map((chunk, index) => ({
      text: chunk.text,
      metadata: {
        ...chunk.metadata,
        document_id: document.id,
        chunk_index: index,
        hub_areas: hubAreas,
        title: title,
        file_type: fileType
      }
    }));
    
    // Store nodes using LlamaIndex
    const storageResult = await storeDocumentNodes(
      document.id,
      enrichedChunks,
      { storeRelationships: true }
    );
    
    if (!storageResult.success) {
      throw new Error(`Failed to store document nodes: ${storageResult.error}`);
    }
    
    // Update batch status as completed
    await supabase
      .from('batch_processing_status')
      .update({
        processed_items: processedDoc.chunks.length,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('batch_id', batchId);
    
    // Calculate processing duration
    const processingDuration = performance.now() - processingStartTime;
    
    // Record performance metrics
    await supabase
      .from('performance_metrics')
      .insert({
        operation_type: 'document_processing',
        duration_ms: Math.round(processingDuration),
        status: 'success',
        document_count: 1,
        cache_hit: false,
        metadata: {
          document_id: document.id,
          chunks_count: processedDoc.chunks.length,
          file_type: fileType,
          processing_time_ms: processingDuration,
          processing_type: 'llamaindex'
        }
      });
    
    return new Response(
      JSON.stringify({
        success: true,
        document_id: document.id,
        chunks_count: processedDoc.chunks.length,
        batch_id: batchId,
        node_ids: storageResult.node_ids,
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
    
    // Update batch status as error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Record error in batch status
      await supabase
        .from('batch_processing_status')
        .update({
          status: 'error',
          error_count: 1,
          metadata: {
            error: error.message,
            error_stack: error.stack
          },
          completed_at: new Date().toISOString()
        })
        .eq('batch_id', batchId);
      
      // Record error in performance metrics
      const processingDuration = performance.now() - processingStartTime;
      await supabase
        .from('performance_metrics')
        .insert({
          operation_type: 'document_processing',
          duration_ms: Math.round(processingDuration),
          status: 'error',
          cache_hit: false,
          error_message: error.message,
          metadata: {
            batch_id: batchId,
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
