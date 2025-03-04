
import { corsHeaders } from "./cors.ts";
import { retry } from "./retry.ts";

// Constants for Graphlit API
const GRAPHLIT_API_BASE_URL = "https://api.graphlit.dev/v1";
const GRAPHLIT_ORG_ID = "52f95f04-8470-4f51-9819-5fd4c8b3bc8b";

interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  splitByHeading?: boolean;
  hierarchical?: boolean;
}

interface GraphlitChunk {
  text: string;
  metadata: Record<string, any>;
  chunk_id: string;
}

interface ProcessedDocument {
  document_id: string;
  chunks: GraphlitChunk[];
  document_metadata: Record<string, any>;
  processing_metadata: Record<string, any>;
}

interface StorageOptions {
  storeRelationships?: boolean;
}

interface StorageResult {
  success: boolean;
  node_ids?: string[];
  error?: string;
}

/**
 * Process a document using Graphlit API
 */
export async function processDocumentWithGraphlit(
  content: string,
  fileName: string,
  fileType: string,
  options: ProcessingOptions = {}
): Promise<ProcessedDocument> {
  const graphlitApiKey = Deno.env.get("GRAPHLIT_TESTING_API_KEY");
  if (!graphlitApiKey) {
    throw new Error("GRAPHLIT_TESTING_API_KEY is not set");
  }

  console.log("Processing document with Graphlit:", {
    fileName,
    fileType,
    contentLength: content.length,
    options
  });

  // Determine content type based on file type
  const contentType = getContentTypeFromFileType(fileType);

  // Prepare the request payload
  const payload = {
    content: content,
    title: fileName,
    content_type: contentType,
    metadata: {
      file_type: fileType,
      original_filename: fileName
    },
    processing_options: {
      chunk_size: options.chunkSize || 1000,
      chunk_overlap: options.chunkOverlap || 200,
      split_by_heading: options.splitByHeading !== false,
      hierarchical: options.hierarchical !== false
    }
  };

  // Call Graphlit API to process the document
  const processResponse = await retry(
    async () => {
      const response = await fetch(`${GRAPHLIT_API_BASE_URL}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${graphlitApiKey}`,
          "X-Graphlit-Org-Id": GRAPHLIT_ORG_ID,
          ...corsHeaders
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Graphlit API error:", {
          status: response.status,
          error: errorText
        });
        throw new Error(`Graphlit API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    },
    {
      retries: 3,
      backoff: 1000
    }
  );

  console.log("Graphlit document processing response:", {
    documentId: processResponse.document_id,
    chunksCount: processResponse.chunks?.length || 0
  });

  // Format the chunks with correct metadata
  const chunks = processResponse.chunks.map((chunk: any) => ({
    text: chunk.content,
    metadata: {
      ...chunk.metadata,
      position: chunk.position,
      source: "graphlit",
      processed_at: new Date().toISOString()
    },
    chunk_id: chunk.id
  }));

  // Return the processed document information
  return {
    document_id: processResponse.document_id,
    chunks: chunks,
    document_metadata: {
      graphlit_id: processResponse.document_id,
      graphlit_version: processResponse.version || "1.0",
      processed_at: new Date().toISOString(),
      content_type: contentType
    },
    processing_metadata: {
      chunk_count: chunks.length,
      processing_options: options,
      processor: "graphlit"
    }
  };
}

/**
 * Store document nodes and their relationships in Supabase
 */
export async function storeDocumentNodes(
  documentId: string,
  chunks: Array<{ text: string; metadata: Record<string, any>; graphlit_chunk_id: string }>,
  options: StorageOptions = {}
): Promise<StorageResult> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not set");
    }

    console.log("Storing document nodes in Supabase:", {
      documentId,
      chunksCount: chunks.length,
      options
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store all chunks in document_chunks table
    const chunkInserts = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk.text,
      chunk_index: chunk.metadata.chunk_index || index,
      metadata: chunk.metadata,
      graphlit_chunk_id: chunk.graphlit_chunk_id
    }));

    const { data: insertedChunks, error: chunksError } = await supabase
      .from("document_chunks")
      .insert(chunkInserts)
      .select("id, graphlit_chunk_id");

    if (chunksError) {
      console.error("Error storing document chunks:", chunksError);
      throw chunksError;
    }

    console.log(`Successfully stored ${insertedChunks.length} document chunks`);

    // If hierarchical relationships should be stored
    if (options.storeRelationships && chunks.length > 1) {
      console.log("Storing hierarchical relationships between chunks");

      // Map Graphlit chunk IDs to Supabase IDs
      const chunkIdMap = new Map();
      insertedChunks.forEach(chunk => {
        chunkIdMap.set(chunk.graphlit_chunk_id, chunk.id);
      });

      // Find chunks with parent-child relationships
      const relationships = [];
      chunks.forEach((chunk, index) => {
        if (chunk.metadata.parent_id && chunkIdMap.has(chunk.graphlit_chunk_id) && chunkIdMap.has(chunk.metadata.parent_id)) {
          relationships.push({
            parent_chunk_id: chunkIdMap.get(chunk.metadata.parent_id),
            child_chunk_id: chunkIdMap.get(chunk.graphlit_chunk_id),
            relationship_type: "hierarchical"
          });
        }
      });

      if (relationships.length > 0) {
        const { error: relError } = await supabase
          .from("node_relationships")
          .insert(relationships);

        if (relError) {
          console.error("Error storing chunk relationships:", relError);
          // Don't throw here, just log the error as this isn't critical
        } else {
          console.log(`Successfully stored ${relationships.length} chunk relationships`);
        }
      }
    }

    return {
      success: true,
      node_ids: insertedChunks.map(chunk => chunk.id)
    };
  } catch (error) {
    console.error("Error in storeDocumentNodes:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to map file types to content types
function getContentTypeFromFileType(fileType: string): string {
  const typeMap: Record<string, string> = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
    "md": "text/markdown",
    "html": "text/html"
  };

  return typeMap[fileType.toLowerCase()] || "text/plain";
}

// Helper function to create a Supabase client
function createClient(supabaseUrl: string, supabaseKey: string) {
  return import("https://esm.sh/@supabase/supabase-js@2.43.0").then(({ createClient }) => {
    return createClient(supabaseUrl, supabaseKey);
  });
}
