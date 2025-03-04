
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
  let documentId = null;
  
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
    
    const requestPayload = await req.json();
    
    // Input validation with detailed logging
    if (!requestPayload) {
      console.error("Request payload is missing or empty");
      throw new Error('Request payload is missing or empty');
    }
    
    const { 
      title, 
      content, 
      fileType, 
      hubAreas, 
      metadata = {}, 
      isBase64 = false,
      processingOptions = {}
    } = requestPayload as DocumentInput;
    
    // Extended input validation
    if (!title) {
      console.error("Document title is required");
      throw new Error('Document title is required');
    }
    if (!content) {
      console.error("Document content is required");
      throw new Error('Document content is required');
    }
    if (!fileType) {
      console.error("Document file type is required");
      throw new Error('Document file type is required');
    }
    if (!hubAreas || !Array.isArray(hubAreas)) {
      console.error("Document hub areas must be an array");
      throw new Error('Document hub areas must be an array');
    }
    
    // Log document processing parameters
    console.log("Document received for processing:", {
      title: title,
      fileType: fileType,
      contentLength: content?.length,
      contentExcerpt: typeof content === 'string' ? content.substring(0, 100) + '...' : 'Invalid content format',
      hubAreas: hubAreas,
      isBase64: isBase64,
      hasMetadata: !!metadata,
      processingOptions: processingOptions
    });
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Processing document: ${title} (${fileType})`);
    
    // Create batch status record
    const batchResponse = await supabase
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
      
    if (batchResponse.error) {
      console.error("Failed to create batch status record:", batchResponse.error);
      throw new Error(`Failed to create batch status record: ${batchResponse.error.message}`);
    }
    
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
      console.error("Failed to create document:", documentError);
      throw new Error(`Failed to create document: ${documentError.message}`);
    }
    
    documentId = document.id;
    console.log(`Document created with ID: ${document.id}`);
    
    // Update batch status with document ID
    const updateResponse = await supabase
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
      
    if (updateResponse.error) {
      console.error("Failed to update batch status with document ID:", updateResponse.error);
    }
    
    // Process document using LlamaIndex
    console.log("Processing document with LlamaIndex...");
    const fileName = metadata.original_filename || `${title}.${fileType}`;
    
    // Detailed logging before LlamaIndex API call
    console.log("Preparing LlamaIndex request:", {
      fileName: fileName,
      fileType: fileType,
      processingOptions: {
        chunkSize: processingOptions.chunkSize || 1000,
        chunkOverlap: processingOptions.chunkOverlap || 200,
        splitByHeading: processingOptions.splitByHeading !== false,
        hierarchical: processingOptions.hierarchical !== false
      },
      hasApiKey: !!llamaindexApiKey,
      contentLength: content?.length,
      isBase64: isBase64
    });
    
    try {
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
      
      // Detailed logging before storing nodes
      console.log("Preparing to store document nodes:", {
        documentId: document.id,
        chunksCount: enrichedChunks.length,
        storeRelationships: true
      });
      
      // Store nodes using LlamaIndex
      const storageResult = await storeDocumentNodes(
        document.id,
        enrichedChunks,
        { storeRelationships: true }
      );
      
      if (!storageResult.success) {
        console.error("Failed to store document nodes:", storageResult.error);
        throw new Error(`Failed to store document nodes: ${storageResult.error}`);
      }
      
      console.log("Successfully stored document nodes:", {
        nodeCount: storageResult.node_ids?.length || 0,
        success: storageResult.success
      });
      
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
    } catch (processingError) {
      console.error("Error during LlamaIndex processing:", {
        message: processingError.message,
        stack: processingError.stack,
        cause: processingError.cause,
        documentId: document.id,
        title: title,
        fileType: fileType
      });
      throw processingError; // rethrow to be captured by the outer try-catch
    }
  } catch (error) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      type: error.constructor.name,
      documentId: documentId,
      phase: 'document_processing'
    });
    
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
            error_stack: error.stack,
            error_type: error.constructor.name,
            error_cause: error.cause ? JSON.stringify(error.cause) : undefined
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
            document_id: documentId,
            error_details: error.stack,
            error_type: error.constructor.name
          }
        });
    } catch (loggingError) {
      console.error('Error logging failure:', {
        original_error: error.message,
        logging_error: loggingError.message,
        stack: loggingError.stack
      });
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        error_type: error.constructor.name,
        batch_id: batchId,
        document_id: documentId
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
