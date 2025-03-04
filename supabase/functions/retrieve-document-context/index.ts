
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'
import { generateEmbedding } from '../_shared/openai.ts'

interface RequestBody {
  query: string
  hubArea?: string
  similarityThreshold?: number
  matchLimit?: number
  useCaching?: boolean
  userId?: string
  trackMetrics?: boolean
  batchSize?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = performance.now();
  let status = 'success';
  let errorMessage = '';
  let cacheHit = false;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      query, 
      hubArea, 
      similarityThreshold = 0.7, 
      matchLimit = 5, 
      useCaching = true,
      userId,
      trackMetrics = true,
      batchSize = 50
    } = await req.json() as RequestBody

    console.log('Processing context retrieval:', { 
      query: query.slice(0, 50) + (query.length > 50 ? '...' : ''), 
      hubArea, 
      similarityThreshold, 
      matchLimit,
      useCaching
    });

    // Generate cache key if caching is enabled
    const cacheKey = useCaching ? `${query}_${hubArea || 'all'}_${similarityThreshold}_${matchLimit}` : null

    // Check cache first if enabled
    if (cacheKey) {
      const { data: cachedResult } = await supabaseClient
        .from('context_cache')
        .select('results, hit_count')
        .eq('cache_key', cacheKey)
        .single()

      if (cachedResult) {
        console.log('Cache hit for query:', query.slice(0, 50) + (query.length > 50 ? '...' : ''));
        
        // Update cache hit count and last accessed timestamp
        await supabaseClient
          .from('context_cache')
          .update({
            hit_count: (cachedResult.hit_count || 0) + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('cache_key', cacheKey)
        
        cacheHit = true;
        
        // Record performance metrics
        if (trackMetrics) {
          await recordPerformanceMetrics(supabaseClient, {
            operationType: 'context_retrieval',
            durationMs: Math.round(performance.now() - startTime),
            cacheHit: true,
            hubArea,
            userId,
            documentCount: Array.isArray(cachedResult.results) ? cachedResult.results.length : 0,
            status: 'success'
          });
        }

        return new Response(JSON.stringify({
          ...cachedResult.results, 
          fromCache: true,
          performance: {
            durationMs: Math.round(performance.now() - startTime),
            cacheHit: true
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Generate embedding for the query
    const embedding = await generateEmbedding(query)

    // Process retrieval in batches if needed
    let allChunks = [];
    let processedBatches = 0;
    let remaining = matchLimit;

    while (remaining > 0) {
      const batchLimit = Math.min(remaining, batchSize);
      
      console.log(`Processing batch ${processedBatches + 1}, limit: ${batchLimit}`);
      
      const { data: batchChunks, error: chunksError } = await supabaseClient
        .rpc('match_document_chunks', {
          query_embedding: embedding,
          similarity_threshold: similarityThreshold,
          match_count: batchLimit,
          filter_hub_area: hubArea || null
        })

      if (chunksError) {
        throw chunksError;
      }

      if (!batchChunks || batchChunks.length === 0) {
        // No more results to fetch
        break;
      }

      allChunks = [...allChunks, ...batchChunks];
      remaining -= batchChunks.length;
      processedBatches++;

      // If we got fewer results than requested, no need to continue
      if (batchChunks.length < batchLimit) {
        break;
      }
    }

    console.log(`Retrieved ${allChunks.length} chunks from ${processedBatches} batches`);

    // Enrich chunks with document metadata
    const documentIds = [...new Set(allChunks.map(chunk => chunk.document_id))];
    
    const { data: documents } = await supabaseClient
      .from('documents')
      .select('id, title, file_type, hub_areas')
      .in('id', documentIds);

    const enrichedChunks = allChunks.map(chunk => ({
      ...chunk,
      document: documents?.find(doc => doc.id === chunk.document_id)
    }));

    // Calculate quality metrics
    const qualityMetrics = calculateQualityMetrics(enrichedChunks);

    // Record retrieval quality metrics
    if (trackMetrics) {
      await recordQualityMetrics(supabaseClient, {
        query,
        hubArea,
        similarityThreshold,
        matchCount: matchLimit,
        totalResults: enrichedChunks.length,
        avgSimilarity: qualityMetrics.avgSimilarity,
        maxSimilarity: qualityMetrics.maxSimilarity,
        minSimilarity: qualityMetrics.minSimilarity,
        userId
      });
    }

    // Cache results if enabled
    if (cacheKey) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Default expiration of 1 day

      await supabaseClient
        .from('context_cache')
        .upsert({
          cache_key: cacheKey,
          query,
          hub_area: hubArea,
          results: enrichedChunks,
          hit_count: 1,
          last_accessed: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        });
    }

    // Record performance metrics
    if (trackMetrics) {
      await recordPerformanceMetrics(supabaseClient, {
        operationType: 'context_retrieval',
        durationMs: Math.round(performance.now() - startTime),
        cacheHit: false,
        hubArea,
        userId,
        documentCount: enrichedChunks.length,
        status: 'success'
      });
    }

    return new Response(JSON.stringify({
      ...enrichedChunks, 
      fromCache: false,
      performance: {
        durationMs: Math.round(performance.now() - startTime),
        cacheHit: false,
        batches: processedBatches,
        qualityMetrics
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in context retrieval:', error);
    status = 'error';
    errorMessage = error.message;
    
    // Record error performance metrics
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await recordPerformanceMetrics(supabaseClient, {
        operationType: 'context_retrieval',
        durationMs: Math.round(performance.now() - startTime),
        cacheHit: cacheHit,
        status: 'error',
        errorMessage: error.message
      });
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
    });
  }
});

// Helper function to record performance metrics
async function recordPerformanceMetrics(
  supabaseClient: any, 
  params: {
    operationType: string,
    operationDetails?: Record<string, any>,
    durationMs: number,
    cacheHit: boolean,
    hubArea?: string,
    userId?: string,
    documentCount?: number,
    status: string,
    errorMessage?: string
  }
) {
  try {
    await supabaseClient
      .from('performance_metrics')
      .insert({
        operation_type: params.operationType,
        operation_details: params.operationDetails || {},
        duration_ms: params.durationMs,
        cache_hit: params.cacheHit,
        hub_area: params.hubArea,
        user_id: params.userId,
        document_count: params.documentCount,
        status: params.status,
        error_message: params.errorMessage
      });
  } catch (error) {
    console.error('Failed to record performance metrics:', error);
  }
}

// Helper function to record quality metrics
async function recordQualityMetrics(
  supabaseClient: any,
  params: {
    query: string,
    hubArea?: string,
    similarityThreshold: number,
    matchCount: number,
    totalResults: number,
    avgSimilarity: number,
    maxSimilarity: number,
    minSimilarity: number,
    userId?: string
  }
) {
  try {
    await supabaseClient
      .from('retrieval_quality_metrics')
      .insert({
        query: params.query,
        hub_area: params.hubArea,
        similarity_threshold: params.similarityThreshold,
        match_count: params.matchCount,
        total_results: params.totalResults,
        avg_similarity: params.avgSimilarity,
        max_similarity: params.maxSimilarity,
        min_similarity: params.minSimilarity,
        user_id: params.userId
      });
  } catch (error) {
    console.error('Failed to record quality metrics:', error);
  }
}

// Helper function to calculate quality metrics from results
function calculateQualityMetrics(chunks: any[]) {
  if (!chunks || chunks.length === 0) {
    return {
      avgSimilarity: 0,
      maxSimilarity: 0,
      minSimilarity: 0
    };
  }

  const similarities = chunks.map(chunk => chunk.similarity);
  
  return {
    avgSimilarity: similarities.reduce((sum, val) => sum + val, 0) / similarities.length,
    maxSimilarity: Math.max(...similarities),
    minSimilarity: Math.min(...similarities)
  };
}
