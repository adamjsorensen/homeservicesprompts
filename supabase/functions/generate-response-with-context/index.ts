
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'
import { callLlamaIndex } from '../_shared/llama-index.ts'

interface RequestBody {
  query: string
  contextChunks: Array<{
    content: string
    document_id: string
    similarity: number
  }>
  hubArea?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, contextChunks, hubArea } = await req.json() as RequestBody

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Prepare context for LlamaIndex
    const context = contextChunks.map(chunk => ({
      content: chunk.content,
      metadata: {
        document_id: chunk.document_id,
        similarity: chunk.similarity
      }
    }))

    // Generate response using LlamaIndex
    const response = await callLlamaIndex(query, context, hubArea)

    // Store document references
    if (response.citations) {
      const documentReferences = response.citations.map(citation => ({
        document_id: citation.document_id,
        citation_context: citation.context,
        relevance_score: citation.relevance
      }))

      await supabaseClient
        .from('document_references')
        .insert(documentReferences)
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
