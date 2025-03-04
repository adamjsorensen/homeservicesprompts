
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const LLAMAINDEX_API_KEY = Deno.env.get('LLAMAINDEX_API_KEY') || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, context, outputFormat, userId, queryHistory } = await req.json();

    console.log('Generating enhanced response:', {
      query: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
      contextSize: context.relevantChunks.length,
      outputFormat
    });

    // Use LlamaIndex's chat synthesis API
    const response = await fetch('https://api.llamaindex.ai/v1/chat/synthesis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate, well-cited responses based on the given context.'
          },
          ...queryHistory.map(q => ({ role: 'user', content: q })),
          { role: 'user', content: query }
        ],
        context: context.relevantChunks,
        output_format: {
          type: outputFormat,
          citation_style: 'inline'
        },
        synthesis_options: {
          cross_validate: true,
          auto_follow_up: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LlamaIndex API error: ${response.status}`);
    }

    const result = await response.json();

    // Store response quality metrics
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('response_quality_metrics')
        .insert({
          query_id: context.queryId,
          response_id: result.id,
          relevance_score: result.metadata.relevance,
          completeness_score: result.metadata.completeness,
          citation_accuracy_score: result.metadata.citation_accuracy,
          source_diversity_score: result.metadata.source_diversity
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in enhanced response generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
