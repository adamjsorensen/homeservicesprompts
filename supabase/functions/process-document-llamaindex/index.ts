
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

interface DocumentChunk {
  content: string;
  metadata: Record<string, unknown>;
  chunkIndex: number;
}

// Settings for document chunking
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }))

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, content, fileType, hubAreas, metadata = {} } = await req.json() as DocumentInput

    console.log('Processing document with LlamaIndex:', { title, fileType, hubAreas })

    // Step 1: Store the document first
    const { data: document, error: insertError } = await supabaseClient
      .from('documents')
      .insert({
        title,
        content,
        file_type: fileType,
        hub_areas: hubAreas,
        metadata,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing document:', insertError)
      throw insertError
    }

    const documentId = document.id
    console.log('Successfully stored document with ID:', documentId)

    // Step 2: Split the document into chunks
    const chunks = await splitDocument(content, metadata, documentId)
    console.log(`Document split into ${chunks.length} chunks`)

    // Step 3: Process each chunk in parallel with rate limiting
    const processedChunks = await processChunksWithRateLimit(chunks, openai, 3) // Process 3 at a time
    console.log('Generated embeddings for all chunks')

    // Step 4: Store all chunks in database
    for (const [index, chunk] of processedChunks.entries()) {
      const { content, metadata, embedding } = chunk
      
      const { error: chunkError } = await supabaseClient
        .from('document_chunks')
        .insert({
          document_id: documentId,
          content,
          metadata,
          embedding,
          chunk_index: index,
        })

      if (chunkError) {
        console.error(`Error storing chunk ${index}:`, chunkError)
        // Continue processing other chunks even if one fails
      }
    }

    console.log('Successfully processed and stored all chunks')

    // Step 5: Create a document version record
    await supabaseClient
      .from('document_versions')
      .insert({
        document_id: documentId,
        version: 1, // Initial version
        changes: { action: 'created' },
      })

    // Step 6: Generate a document-level embedding for faster retrieval of entire documents
    const docEmbeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: content.slice(0, 8000), // OpenAI has a token limit
    })
    
    const [{ embedding: docEmbedding }] = docEmbeddingResponse.data.data

    // Update the document with the embedding
    await supabaseClient
      .from('documents')
      .update({ embedding: docEmbedding })
      .eq('id', documentId)

    return new Response(
      JSON.stringify({
        document_id: documentId,
        chunks_count: processedChunks.length,
        status: 'success'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing document with LlamaIndex:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to split document into chunks with overlap
async function splitDocument(
  content: string, 
  metadata: Record<string, unknown>,
  documentId: string
): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = []
  const words = content.split(/\s+/)
  
  // Simple sliding window for now, can be upgraded to LlamaIndex splitters later
  for (let i = 0; i < words.length; i += (CHUNK_SIZE - CHUNK_OVERLAP)) {
    // Don't create empty chunks at the end
    if (i >= words.length) break

    const chunkWords = words.slice(i, i + CHUNK_SIZE)
    const chunkContent = chunkWords.join(' ')
    
    const chunkMetadata = {
      ...metadata,
      document_id: documentId,
      chunk_start_idx: i,
      chunk_end_idx: i + chunkWords.length - 1,
      chunk_size: chunkWords.length
    }
    
    chunks.push({
      content: chunkContent,
      metadata: chunkMetadata,
      chunkIndex: Math.floor(i / (CHUNK_SIZE - CHUNK_OVERLAP))
    })
  }
  
  return chunks
}

// Process chunks with rate limiting to avoid hitting API limits
async function processChunksWithRateLimit(
  chunks: DocumentChunk[],
  openai: OpenAIApi,
  batchSize: number
) {
  const processedChunks = []
  const batches = Math.ceil(chunks.length / batchSize)
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize
    const end = Math.min(start + batchSize, chunks.length)
    const batchChunks = chunks.slice(start, end)
    
    // Process this batch in parallel
    const batchPromises = batchChunks.map(async (chunk) => {
      try {
        const embeddingResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: chunk.content,
        })
        
        const [{ embedding }] = embeddingResponse.data.data
        
        return {
          ...chunk,
          embedding
        }
      } catch (error) {
        console.error(`Error processing chunk ${chunk.chunkIndex}:`, error)
        // Return the chunk without embedding so we can handle it later
        return { ...chunk, error: error.message }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    processedChunks.push(...batchResults)
    
    // Add a small delay between batches to respect rate limits
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return processedChunks
}
