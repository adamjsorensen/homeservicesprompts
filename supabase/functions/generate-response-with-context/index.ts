
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
  userId?: string
  trackMetrics?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = performance.now();
  let status = 'success';
  let errorMessage = '';

  try {
    const { query, contextChunks, hubArea, userId, trackMetrics = true } = await req.json() as RequestBody

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Generating response with context:', { 
      query: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
      contextChunksCount: contextChunks.length,
      hubArea
    });

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
    if (response.citations && response.citations.length > 0) {
      console.log(`Storing ${response.citations.length} document references`);
      
      // Create a new prompt generation record
      const { data: generation, error: genError } = await supabaseClient
        .from('prompt_generations')
        .insert({
          created_by: userId || '00000000-0000-0000-0000-000000000000',
          custom_prompt_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
          generated_content: response.content
        })
        .select()
        .single()

      if (genError) {
        console.error('Error creating prompt generation:', genError);
      } else {
        // Store document references
        const documentReferences = response.citations.map(citation => ({
          document_id: citation.document_id,
          citation_context: citation.context,
          relevance_score: citation.relevance,
          prompt_generation_id: generation.id
        }))

        const { error: refError } = await supabaseClient
          .from('document_references')
          .insert(documentReferences)

        if (refError) {
          console.error('Error storing document references:', refError);
        }
      }
    }

    // Record performance metrics
    if (trackMetrics) {
      await supabaseClient
        .from('performance_metrics')
        .insert({
          operation_type: 'response_generation',
          operation_details: {
            contextChunksCount: contextChunks.length,
            citationsCount: response.citations?.length || 0,
            responseLength: response.content.length
          },
          duration_ms: Math.round(performance.now() - startTime),
          cache_hit: false,
          hub_area: hubArea,
          user_id: userId,
          document_count: contextChunks.length,
          status: 'success'
        })
    }

    return new Response(JSON.stringify({
      ...response,
      performance: {
        durationMs: Math.round(performance.now() - startTime)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error generating response:', error);
    status = 'error';
    errorMessage = error.message;
    
    // Record error performance metrics
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      await supabaseClient
        .from('performance_metrics')
        .insert({
          operation_type: 'response_generation',
          duration_ms: Math.round(performance.now() - startTime),
          status: 'error',
          error_message: error.message
        })
    } catch (metricError) {
      console.error('Failed to record error metrics:', metricError);
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      performance: {
        durationMs: Math.round(performance.now() - startTime),
        status: 'error'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
