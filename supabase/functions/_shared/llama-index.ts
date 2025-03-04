
import { withRetry } from "./retry.ts";

// Configuration for LlamaIndex API
const LLAMAINDEX_API_KEY = Deno.env.get('LLAMAINDEX_API_KEY') || '';
const LLAMAINDEX_API_URL = 'https://api.llamaindex.ai/v1';

// Supported document types and their MIME types
export const SUPPORTED_DOC_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  html: 'text/html',
};

// Document processing options interface
export interface DocumentProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  splitByHeading?: boolean;
  hierarchical?: boolean;
}

// Process document with LlamaIndex
export async function processDocumentWithLlamaIndex(
  fileContent: string, 
  fileName: string,
  fileType: string,
  options: DocumentProcessingOptions = {}
): Promise<{
  chunks: Array<{ text: string; metadata: Record<string, any> }>;
  document_metadata: Record<string, any>;
  processing_metadata: Record<string, any>;
}> {
  const isBase64 = !fileContent.startsWith('{') && !fileContent.startsWith('[') && 
                   !fileContent.startsWith('<') && !fileContent.startsWith(' ');
  
  // Set default options if not provided
  const processingOptions = {
    chunkSize: options.chunkSize || 1000,
    chunkOverlap: options.chunkOverlap || 200,
    splitByHeading: options.splitByHeading || true,
    hierarchical: options.hierarchical || true,
  };
  
  console.log(`Processing document with LlamaIndex: ${fileName} (${fileType})`);
  console.log(`Options: ${JSON.stringify(processingOptions)}`);
  
  return withRetry(async () => {
    const response = await fetch(`${LLAMAINDEX_API_URL}/documents/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`
      },
      body: JSON.stringify({
        document: {
          file_name: fileName,
          file_type: fileType,
          content: fileContent,
          is_base64: isBase64
        },
        processing_options: {
          chunk_size: processingOptions.chunkSize,
          chunk_overlap: processingOptions.chunkOverlap,
          split_by_heading: processingOptions.splitByHeading,
          create_hierarchical_nodes: processingOptions.hierarchical
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LlamaIndex document processing error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      return error.message.includes('429') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503');
    }
  });
}

// Store document nodes in vector store
export async function storeDocumentNodes(
  documentId: string,
  chunks: Array<{ text: string; metadata: Record<string, any> }>,
  options: { storeRelationships?: boolean } = {}
): Promise<{
  success: boolean;
  node_ids: string[];
  error?: string;
}> {
  return withRetry(async () => {
    const response = await fetch(`${LLAMAINDEX_API_URL}/vectors/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`
      },
      body: JSON.stringify({
        document_id: documentId,
        nodes: chunks,
        store_relationships: options.storeRelationships !== false,
        vector_store: "supabase",
        vector_store_options: {
          table_name: "document_chunks",
          embedding_column: "embedding",
          content_column: "content",
          metadata_column: "metadata"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LlamaIndex vector store error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      return error.message.includes('429') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503');
    }
  });
}

// Query document context (existing function updated with more options)
export async function callLlamaIndex(
  query: string,
  context: Array<{ content: string; metadata: Record<string, any> }>,
  hubArea?: string,
  options: {
    maxResults?: number;
    similarityThreshold?: number;
    includeMetadata?: boolean;
  } = {}
): Promise<{
  content: string;
  citations: Array<{ document_id: string; context: string; relevance: number }>;
}> {
  return withRetry(async () => {
    const response = await fetch(`${LLAMAINDEX_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant. Use the provided context to answer questions. 
                    Always cite your sources using document IDs from the context.
                    ${hubArea ? `Focus on information relevant to the ${hubArea} area.` : ''}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        context: context,
        response_format: {
          type: 'json',
          schema: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              citations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    document_id: { type: 'string' },
                    context: { type: 'string' },
                    relevance: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        options: {
          max_results: options.maxResults || 5,
          similarity_threshold: options.similarityThreshold || 0.7,
          include_metadata: options.includeMetadata !== false
        }
      })
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LlamaIndex API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
  
    return await response.json();
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      return error.message.includes('429') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503');
    }
  });
}
