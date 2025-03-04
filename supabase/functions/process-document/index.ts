
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentInput {
  title: string;
  content: string;
  fileType: string;
  hubAreas: string[];
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }))

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, content, fileType, hubAreas, metadata } = await req.json() as DocumentInput

    console.log('Processing document:', { title, fileType, hubAreas })

    // Generate embedding for the document content
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: content.slice(0, 8000), // OpenAI has a token limit
    })

    const [{ embedding }] = embeddingResponse.data.data

    console.log('Generated embedding of length:', embedding.length)

    // Store document with embedding
    const { data: document, error: insertError } = await supabaseClient
      .from('documents')
      .insert({
        title,
        content,
        file_type: fileType,
        hub_areas: hubAreas,
        metadata: metadata || {},
        embedding,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    console.log('Successfully stored document with ID:', document.id)

    return new Response(
      JSON.stringify(document),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
