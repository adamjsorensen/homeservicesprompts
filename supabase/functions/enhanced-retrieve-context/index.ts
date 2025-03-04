
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const LLAMAINDEX_API_KEY = Deno.env.get('LLAMAINDEX_API_KEY') || '';

interface RequestBody {
  query: string;
  hubArea?: string;
  filters?: Record<string, any>;
  userId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, hubArea, filters, userId } = await req.json() as RequestBody;

    console.log('Processing enhanced context retrieval:', {
      query: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
      hubArea,
      filters
    });

    // Use LlamaIndex's hybrid search API
    const response = await fetch('https://api.llamaindex.ai/v1/query/hybrid', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        retriever_type: 'hybrid',
        filters: {
          hub_area: hubArea,
          ...filters
        },
        relationship_mode: 'hierarchical',
        ranking_mode: 'semantic'
      })
    });

    if (!response.ok) {
      throw new Error(`LlamaIndex API error: ${response.status}`);
    }

    const llamaIndexResult = await response.json();

    // Store query in history
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('query_history')
        .insert({
          user_id: userId,
          query_text: query,
          context_chunks: llamaIndexResult.chunk_ids,
          hub_area: hubArea,
          filters
        });
    }

    return new Response(JSON.stringify(llamaIndexResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in enhanced context retrieval:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
