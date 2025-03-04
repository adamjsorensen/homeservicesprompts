
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0"
import { corsHeaders } from "../_shared/cors.ts"

interface BatchProcessRequest {
  documentIds?: string[]
  hubArea?: string
  chunkSize?: number
  overlap?: number
  reprocess?: boolean
  priority?: 'high' | 'normal' | 'low'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = performance.now();
  let status = 'pending';
  let errorMessage = '';
  let totalDocuments = 0;
  let processedDocuments = 0;
  let failedDocuments = 0;
  
  try {
    const { 
      documentIds,
      hubArea,
      chunkSize = 1000,
      overlap = 200,
      reprocess = false,
      priority = 'normal'
    } = await req.json() as BatchProcessRequest;
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('Starting batch document processing:', {
      documentCount: documentIds?.length,
      hubArea,
      chunkSize,
      overlap,
      reprocess,
      priority
    });
    
    // Create a new batch processing job record
    const { data: jobData, error: jobError } = await supabaseClient
      .from('batch_processing_jobs')
      .insert({
        job_type: 'document_processing',
        status: 'processing',
        details: {
          documentIds,
          hubArea,
          chunkSize,
          overlap,
          reprocess,
          priority
        },
        started_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (jobError) {
      throw new Error(`Failed to create batch job: ${jobError.message}`);
    }
    
    const jobId = jobData.id;
    console.log(`Created batch job with ID: ${jobId}`);
    
    // Query documents to process
    let documentsQuery = supabaseClient
      .from('documents')
      .select('id, title, content, file_type, hub_areas');
      
    // Filter by documentIds if provided
    if (documentIds && documentIds.length > 0) {
      documentsQuery = documentsQuery.in('id', documentIds);
    }
    
    // Filter by hubArea if provided
    if (hubArea) {
      documentsQuery = documentsQuery.contains('hub_areas', [hubArea]);
    }
    
    // If not reprocessing, only select documents without chunks
    if (!reprocess) {
      // This is a simplified approach - in a real app, you'd use a more sophisticated query
      // to find documents without associated chunks
      const { data: processedDocIds } = await supabaseClient
        .from('document_chunks')
        .select('document_id')
        .not('document_id', 'is', null);
        
      if (processedDocIds && processedDocIds.length > 0) {
        const processedIds = [...new Set(processedDocIds.map(d => d.document_id))];
        documentsQuery = documentsQuery.not('id', 'in', processedIds);
      }
    }
    
    // Execute the query
    const { data: documents, error: documentsError } = await documentsQuery;
    
    if (documentsError) {
      throw new Error(`Failed to query documents: ${documentsError.message}`);
    }
    
    totalDocuments = documents.length;
    console.log(`Found ${totalDocuments} documents to process`);
    
    // Update job with total items
    await supabaseClient
      .from('batch_processing_jobs')
      .update({ total_items: totalDocuments })
      .eq('id', jobId);
    
    // Process documents in background
    const processDocuments = async () => {
      for (const document of documents) {
        try {
          console.log(`Processing document: ${document.title} (${document.id})`);
          
          // Call the document processing function
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-llamaindex`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              title: document.title,
              content: document.content,
              fileType: document.file_type,
              hubAreas: document.hub_areas,
              metadata: {
                batchJobId: jobId,
                priority,
                chunkSize,
                overlap
              }
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Processing failed: ${errorData.error || response.statusText}`);
          }
          
          processedDocuments++;
          
          // Update job progress
          await supabaseClient
            .from('batch_processing_jobs')
            .update({ 
              processed_items: processedDocuments,
              failed_items: failedDocuments
            })
            .eq('id', jobId);
            
        } catch (error) {
          console.error(`Error processing document ${document.id}:`, error);
          failedDocuments++;
          
          // Update job with error info
          await supabaseClient
            .from('batch_processing_jobs')
            .update({ 
              processed_items: processedDocuments,
              failed_items: failedDocuments
            })
            .eq('id', jobId);
        }
      }
      
      // Mark job as completed
      const completedStatus = failedDocuments > 0 ? 'completed_with_errors' : 'completed';
      await supabaseClient
        .from('batch_processing_jobs')
        .update({ 
          status: completedStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
        
      console.log(`Batch job ${jobId} completed. Processed: ${processedDocuments}, Failed: ${failedDocuments}`);
    };
    
    // Start processing in the background
    EdgeRuntime.waitUntil(processDocuments());
    
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        totalDocuments,
        message: `Started batch processing of ${totalDocuments} documents.`,
        performance: { durationMs: Math.round(performance.now() - startTime) }
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
    console.error('Error in batch processing:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        performance: { durationMs: Math.round(performance.now() - startTime) }
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

// Handle function shutdown
addEventListener('beforeunload', (ev) => {
  console.log('Function shutdown due to:', ev.detail?.reason);
  // Could potentially save state or log progress here
});
