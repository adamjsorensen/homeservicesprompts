
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Embedding generation from OpenAI
async function generateEmbedding(content: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: content,
      model: 'text-embedding-3-small',
    }),
  });

  const result = await response.json();
  
  if (!result.data || !result.data[0]) {
    console.error('Error generating embedding:', result);
    throw new Error('Failed to generate embedding: ' + JSON.stringify(result));
  }
  
  return result.data[0].embedding;
}

// Apply hub-specific weighting to similarity scores
function applyHubWeighting(similarity: number, documentHubAreas: string[], queryHubArea?: string): number {
  // If no specific hub area is targeted, return the original similarity
  if (!queryHubArea) return similarity;
  
  // If document belongs to the requested hub area, boost its relevance
  if (documentHubAreas.includes(queryHubArea)) {
    // Apply a 20% boost to documents in the requested hub area
    return similarity * 1.2;
  }
  
  return similarity;
}

// Calculate context quality score based on multiple factors
function calculateQualityScore(
  similarity: number, 
  chunkMetadata: Record<string, any> | null,
  documentTitle: string
): number {
  // Base score is the similarity
  let qualityScore = similarity;
  
  // Add bonus for chunks with rich metadata
  if (chunkMetadata) {
    // Check if metadata includes positions like "introduction", "summary", etc.
    const positionBonus = chunkMetadata.position_description ? 0.05 : 0;
    
    // Check if metadata includes important content markers
    const importanceBonus = chunkMetadata.importance_score ? 
      (parseFloat(chunkMetadata.importance_score) * 0.1) : 0;
    
    qualityScore += positionBonus + importanceBonus;
  }
  
  // Slightly prefer chunks from documents with descriptive titles
  // (simple heuristic: longer titles tend to be more descriptive)
  const titleBonus = Math.min(documentTitle.length / 200, 0.05);
  qualityScore += titleBonus;
  
  return qualityScore;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { 
      query, 
      hubArea, 
      similarityThreshold = 0.7, 
      matchCount = 5,
      useCached = true
    } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Retrieving context for query: "${query.substring(0, 50)}..."${hubArea ? ` in hub area: ${hubArea}` : ''}`);
    
    // Check for cached results if enabled
    if (useCached) {
      // We use a simple hash of the query and hub area as cache key
      const cacheKey = `${query.trim().toLowerCase()}:${hubArea || 'all'}`;
      const { data: cachedResults } = await supabase
        .from('context_cache')
        .select('results, created_at')
        .eq('cache_key', cacheKey)
        .single();
      
      // If we have cached results that are less than 1 hour old, use them
      if (cachedResults && cachedResults.created_at) {
        const cacheTime = new Date(cachedResults.created_at);
        const now = new Date();
        const cacheAgeMs = now.getTime() - cacheTime.getTime();
        const cacheAgeHours = cacheAgeMs / (1000 * 60 * 60);
        
        if (cacheAgeHours < 1) {
          console.log(`Using cached results from ${Math.round(cacheAgeHours * 60)} minutes ago`);
          return new Response(
            JSON.stringify({
              results: cachedResults.results,
              source: 'cache'
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
              status: 200,
            }
          );
        }
      }
    }
    
    // Generate embedding for the query
    console.log('Generating embedding for query');
    const queryEmbedding = await generateEmbedding(query);
    
    // Retrieve relevant document chunks
    console.log('Querying for relevant document chunks');
    const { data: chunks, error: chunksError } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: queryEmbedding,
        similarity_threshold: similarityThreshold,
        match_count: matchCount * 2, // Get more than we need so we can filter and rank
        filter_hub_area: hubArea
      }
    );
    
    if (chunksError) {
      throw new Error(`Failed to query document chunks: ${chunksError.message}`);
    }
    
    console.log(`Retrieved ${chunks ? chunks.length : 0} relevant chunks`);
    
    // If no chunks were found, return empty results
    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    }
    
    // Fetch document information for each chunk
    const documentIds = [...new Set(chunks.map(chunk => chunk.document_id))];
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, hub_areas')
      .in('id', documentIds);
    
    if (documentsError) {
      throw new Error(`Failed to fetch documents: ${documentsError.message}`);
    }
    
    // Create a map of document id to document info for easy lookup
    const documentMap = (documents || []).reduce((map, doc) => {
      map[doc.id] = doc;
      return map;
    }, {} as Record<string, any>);
    
    // Enhance chunks with quality score and document info
    const enhancedChunks = chunks.map(chunk => {
      const document = documentMap[chunk.document_id] || { title: 'Unknown', hub_areas: [] };
      
      // Apply hub-specific weighting to similarity score
      const weightedSimilarity = applyHubWeighting(
        chunk.similarity, 
        document.hub_areas,
        hubArea
      );
      
      // Calculate overall quality score
      const qualityScore = calculateQualityScore(
        weightedSimilarity,
        chunk.metadata,
        document.title
      );
      
      return {
        ...chunk,
        document_title: document.title,
        document_hub_areas: document.hub_areas,
        weighted_similarity: weightedSimilarity,
        quality_score: qualityScore
      };
    });
    
    // Sort by quality score and take the top 'matchCount' results
    const topResults = enhancedChunks
      .sort((a, b) => b.quality_score - a.quality_score)
      .slice(0, matchCount);
    
    // Prepare citation contexts for each result
    const contextResults = topResults.map(chunk => {
      return {
        chunk_id: chunk.id,
        document_id: chunk.document_id,
        document_title: chunk.document_title,
        content: chunk.content,
        citation_context: chunk.content.substring(0, 200) + '...',
        relevance_score: chunk.quality_score,
        hub_areas: chunk.document_hub_areas
      };
    });
    
    // Store in cache if caching is enabled
    if (useCached) {
      const cacheKey = `${query.trim().toLowerCase()}:${hubArea || 'all'}`;
      await supabase
        .from('context_cache')
        .upsert({
          cache_key: cacheKey,
          query: query,
          hub_area: hubArea,
          results: contextResults,
          created_at: new Date().toISOString()
        }, { onConflict: 'cache_key' });
    }
    
    return new Response(
      JSON.stringify({
        results: contextResults,
        source: 'live_query'
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
    console.error('Error in retrieve-document-context:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
