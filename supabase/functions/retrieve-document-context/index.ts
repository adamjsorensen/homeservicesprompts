
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'
import { generateEmbedding } from '../_shared/openai.ts'

interface RequestBody {
  query: string
  hubArea?: string
  similarityThreshold?: number
  matchLimit?: number
  useCaching?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, hubArea, similarityThreshold = 0.7, matchLimit = 5, useCaching = true } = await req.json() as RequestBody

    // Generate cache key if caching is enabled
    const cacheKey = useCaching ? `${query}_${hubArea || 'all'}_${similarityThreshold}_${matchLimit}` : null

    // Check cache first if enabled
    if (cacheKey) {
      const { data: cachedResult } = await supabaseClient
        .from('context_cache')
        .select('results')
        .eq('cache_key', cacheKey)
        .single()

      if (cachedResult) {
        return new Response(JSON.stringify(cachedResult.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Generate embedding for the query
    const embedding = await generateEmbedding(query)

    // Get relevant document chunks
    const { data: chunks, error: chunksError } = await supabaseClient
      .rpc('match_document_chunks', {
        query_embedding: embedding,
        similarity_threshold: similarityThreshold,
        match_count: matchLimit,
        filter_hub_area: hubArea || null
      })

    if (chunksError) {
      throw chunksError
    }

    // Enrich chunks with document metadata
    const documentIds = [...new Set(chunks.map(chunk => chunk.document_id))]
    const { data: documents } = await supabaseClient
      .from('documents')
      .select('id, title, file_type, hub_areas')
      .in('id', documentIds)

    const enrichedChunks = chunks.map(chunk => ({
      ...chunk,
      document: documents?.find(doc => doc.id === chunk.document_id)
    }))

    // Cache results if enabled
    if (cacheKey) {
      await supabaseClient
        .from('context_cache')
        .upsert({
          cache_key: cacheKey,
          query,
          hub_area: hubArea,
          results: enrichedChunks
        })
    }

    return new Response(JSON.stringify(enrichedChunks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
