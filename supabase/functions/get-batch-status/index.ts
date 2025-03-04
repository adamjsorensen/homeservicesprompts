
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0"
import { corsHeaders } from "../_shared/cors.ts"

interface GetBatchStatusRequest {
  batchId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { batchId } = await req.json() as GetBatchStatusRequest;
    
    if (!batchId) {
      throw new Error("Batch ID is required");
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log(`Fetching batch status for batch ID: ${batchId}`);
    
    // Query the batch processing status
    const { data, error } = await supabaseClient
      .from('batch_processing_status')
      .select('*')
      .eq('batch_id', batchId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch batch status: ${error.message}`);
    }
    
    // Return the batch status
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching batch status:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
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
