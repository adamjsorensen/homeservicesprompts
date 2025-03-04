
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
  return result.data[0].embedding;
}

// Text chunking logic
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + chunkSize, text.length);
    
    // If we're not at the end and not at the first chunk, try to find a good break point
    if (endIndex < text.length && startIndex > 0) {
      // Look for a period, question mark, or exclamation followed by a space or newline
      const breakPointRegex = /[.?!]\s+/g;
      let matches;
      let lastMatch = null;
      
      // Find the last sentence break within our window
      while ((matches = breakPointRegex.exec(text.substring(startIndex, endIndex))) !== null) {
        lastMatch = matches;
      }
      
      if (lastMatch) {
        endIndex = startIndex + lastMatch.index + 2; // +2 to include the punctuation and space
      }
    }
    
    chunks.push(text.substring(startIndex, endIndex));
    
    // Move the start index for the next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    if (startIndex < 0) startIndex = 0;
  }
  
  return chunks;
}

// Process document and generate chunks
async function processDocument(
  supabaseClient: any, 
  documentId: string, 
  content: string, 
  chunkSize: number = 1000, 
  overlap: number = 200
): Promise<{ success: boolean; chunks_count: number; error?: string }> {
  try {
    // Split text into chunks
    const chunks = chunkText(content, chunkSize, overlap);
    console.log(`Document split into ${chunks.length} chunks`);
    
    // Process each chunk and generate embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding for chunk
      console.log(`Generating embedding for chunk ${i+1}/${chunks.length}`);
      const embedding = await generateEmbedding(chunk);
      
      // Store chunk in database
      const { error } = await supabaseClient
        .from('document_chunks')
        .insert({
          document_id: documentId,
          content: chunk,
          chunk_index: i,
          embedding,
          metadata: { 
            chunk_size: chunkSize,
            overlap,
            position: i,
            total_chunks: chunks.length
          }
        });
      
      if (error) {
        console.error(`Error storing chunk ${i}:`, error);
        throw new Error(`Failed to store chunk ${i}: ${error.message}`);
      }
    }
    
    // Create relationships between adjacent chunks
    for (let i = 0; i < chunks.length - 1; i++) {
      // First get the IDs of the current and next chunks
      const { data: currentChunk, error: currentError } = await supabaseClient
        .from('document_chunks')
        .select('id')
        .eq('document_id', documentId)
        .eq('chunk_index', i)
        .single();
      
      const { data: nextChunk, error: nextError } = await supabaseClient
        .from('document_chunks')
        .select('id')
        .eq('document_id', documentId)
        .eq('chunk_index', i + 1)
        .single();
      
      if (currentError || nextError) {
        console.error('Error retrieving chunk IDs:', currentError || nextError);
        continue;
      }
      
      // Create the relationship
      const { error } = await supabaseClient
        .from('node_relationships')
        .insert({
          parent_chunk_id: currentChunk.id,
          child_chunk_id: nextChunk.id,
          relationship_type: 'sequential'
        });
      
      if (error) {
        console.error(`Error creating relationship between chunks ${i} and ${i+1}:`, error);
      }
    }
    
    // Create initial document version record
    await supabaseClient
      .from('document_versions')
      .insert({
        document_id: documentId,
        version: 1,
        changes: { action: 'created', chunks_count: chunks.length }
      });
    
    return { success: true, chunks_count: chunks.length };
  } catch (error) {
    console.error('Document processing error:', error);
    return { success: false, chunks_count: 0, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { title, content, fileType, hubAreas, metadata } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Processing document: ${title}`);
    
    // Create document record first
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title,
        content,
        file_type: fileType,
        hub_areas: hubAreas,
        metadata: {
          ...metadata,
          processor: 'llamaindex',
          processed_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (documentError) {
      throw new Error(`Failed to create document: ${documentError.message}`);
    }
    
    console.log(`Document created with ID: ${document.id}`);
    
    // Process document and create chunks
    const processingResult = await processDocument(supabase, document.id, content);
    
    if (!processingResult.success) {
      throw new Error(`Document processing failed: ${processingResult.error}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        document_id: document.id,
        chunks_count: processingResult.chunks_count
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
    console.error('Error:', error);
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
