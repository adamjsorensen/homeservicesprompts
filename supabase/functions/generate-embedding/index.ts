
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  text: string;
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

    // Parse request
    const { text } = await req.json() as SearchRequest

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Missing text in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Generating embedding for search query:', text.substring(0, 50) + (text.length > 50 ? '...' : ''))

    // Generate embedding for the text
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text.slice(0, 8000), // OpenAI has a token limit
    })

    const [{ embedding }] = embeddingResponse.data.data

    return new Response(
      JSON.stringify({ embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating embedding:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
