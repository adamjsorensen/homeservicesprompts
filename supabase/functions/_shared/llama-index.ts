import { withRetry } from "./retry.ts";

// Configuration for LlamaIndex API
const LLAMAINDEX_API_KEY = Deno.env.get('LLAMAINDEX_API_KEY');
const LLAMAINDEX_API_URL = 'https://api.llamaindex.ai/v1';

// Validate API key at initialization time
if (!LLAMAINDEX_API_KEY) {
  console.error('LLAMAINDEX_API_KEY environment variable is not set. The edge function will fail.');
  throw new Error('LLAMAINDEX_API_KEY environment variable is not set');
}

console.log("LlamaIndex initialization status:", {
  hasApiKey: !!LLAMAINDEX_API_KEY,
  apiKeyFirstChars: LLAMAINDEX_API_KEY ? `${LLAMAINDEX_API_KEY.substring(0, 3)}...` : 'missing',
  apiKeyLength: LLAMAINDEX_API_KEY ? LLAMAINDEX_API_KEY.length : 0,
  apiUrl: LLAMAINDEX_API_URL
});

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
  
  // Validate content before sending
  if (!fileContent) {
    throw new Error('Document content is empty');
  }
  
  // Validate API key before making the request
  if (!LLAMAINDEX_API_KEY) {
    throw new Error('LLAMAINDEX_API_KEY environment variable is not set');
  }
  
  return withRetry(async () => {
    const requestBody = {
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
    };
    
    console.log("Sending LlamaIndex API request:", {
      endpoint: `${LLAMAINDEX_API_URL}/documents/process`,
      fileName: fileName,
      fileType: fileType,
      contentLength: fileContent.length,
      isBase64: isBase64,
      processingOptions: processingOptions,
      requestBodySize: JSON.stringify(requestBody).length
    });
    
    try {
      const response = await fetch(`${LLAMAINDEX_API_URL}/documents/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
  
      // Log response information
      console.log("LlamaIndex API response status:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
  
      // Check for authentication/authorization errors specifically
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`LlamaIndex API authentication error: ${response.status}`, errorData);
        throw new Error(`LlamaIndex API authentication failed: ${response.status} - Check your API key`);
      }
  
      if (!response.ok) {
        let errorMessage = `LlamaIndex document processing error: ${response.status}`;
        let errorData = {};
        
        try {
          errorData = await response.json();
          console.error(errorMessage, errorData);
        } catch (e) {
          // If we can't parse JSON, try to read the text
          try {
            const errorText = await response.text();
            console.error(errorMessage, { errorText });
            errorMessage += ` - ${errorText.substring(0, 200)}`;
          } catch (textError) {
            console.error("Failed to read error response", textError);
          }
        }
        
        throw new Error(`${errorMessage} ${JSON.stringify(errorData)}`);
      }
  
      const responseData = await response.json();
      console.log("LlamaIndex processing successful:", {
        chunksCount: responseData?.chunks?.length || 0,
        metadataSize: responseData?.document_metadata ? 
          JSON.stringify(responseData.document_metadata).length : 0
      });
      
      return responseData;
    } catch (error) {
      console.error("LlamaIndex API request failed:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      throw error;
    }
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      // Don't retry authentication errors
      if (error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('authentication failed') ||
          error.message.includes('API key')) {
        console.log("Not retrying authentication error:", error.message);
        return false;
      }
      
      // Retry on rate limits or server errors
      const shouldRetry = error.message.includes('429') || 
                          error.message.includes('500') || 
                          error.message.includes('502') || 
                          error.message.includes('503');
                         
      console.log(`Retry decision for error "${error.message}": ${shouldRetry}`);
      return shouldRetry;
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
  // Validate chunks before sending
  if (!chunks || chunks.length === 0) {
    console.error("No chunks provided for storage");
    return {
      success: false,
      node_ids: [],
      error: "No chunks provided for storage"
    };
  }
  
  // Check for chunks with empty text
  const emptyChunks = chunks.filter(chunk => !chunk.text || chunk.text.trim() === '');
  if (emptyChunks.length > 0) {
    console.warn(`Found ${emptyChunks.length} empty chunks out of ${chunks.length} total chunks`);
  }
  
  console.log(`Storing ${chunks.length} document nodes for document ID: ${documentId}`);
  
  return withRetry(async () => {
    // Check again for API key before making the request
    if (!LLAMAINDEX_API_KEY) {
      throw new Error('LLAMAINDEX_API_KEY environment variable is not set');
    }
    
    const requestBody = {
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
    };
    
    console.log("Sending LlamaIndex vector store request:", {
      endpoint: `${LLAMAINDEX_API_URL}/vectors/store`,
      documentId: documentId,
      chunksCount: chunks.length,
      storeRelationships: options.storeRelationships !== false,
      requestBodySize: JSON.stringify(requestBody).length
    });
    
    try {
      const response = await fetch(`${LLAMAINDEX_API_URL}/vectors/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLAMAINDEX_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
  
      // Log response information
      console.log("LlamaIndex vector store response status:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
  
      // Check for authentication/authorization errors specifically
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`LlamaIndex API authentication error: ${response.status}`, errorData);
        throw new Error(`LlamaIndex API authentication failed: ${response.status} - Check your API key`);
      }
  
      if (!response.ok) {
        let errorMessage = `LlamaIndex vector store error: ${response.status}`;
        let errorData = {};
        
        try {
          errorData = await response.json();
          console.error(errorMessage, errorData);
        } catch (e) {
          // If we can't parse JSON, try to read the text
          try {
            const errorText = await response.text();
            console.error(errorMessage, { errorText });
            errorMessage += ` - ${errorText.substring(0, 200)}`;
          } catch (textError) {
            console.error("Failed to read error response", textError);
          }
        }
        
        throw new Error(`${errorMessage} ${JSON.stringify(errorData)}`);
      }
  
      const responseData = await response.json();
      console.log("LlamaIndex vector store successful:", {
        success: responseData?.success,
        nodeIdsCount: responseData?.node_ids?.length || 0
      });
      
      return responseData;
    } catch (error) {
      console.error("LlamaIndex vector store request failed:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        documentId: documentId
      });
      throw error;
    }
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      // Don't retry authentication errors
      if (error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('authentication failed') ||
          error.message.includes('API key')) {
        console.log("Not retrying authentication error:", error.message);
        return false;
      }
      
      // Retry on rate limits or server errors
      const shouldRetry = error.message.includes('429') || 
                          error.message.includes('500') || 
                          error.message.includes('502') || 
                          error.message.includes('503');
                          
      console.log(`Retry decision for error "${error.message}": ${shouldRetry}`);
      return shouldRetry;
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
    // Check again for API key before making the request
    if (!LLAMAINDEX_API_KEY) {
      throw new Error('LLAMAINDEX_API_KEY environment variable is not set');
    }
    
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
  
    // Check for authentication/authorization errors specifically
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`LlamaIndex API authentication error: ${response.status}`, errorData);
      throw new Error(`LlamaIndex API authentication failed: ${response.status} - Check your API key`);
    }
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`LlamaIndex API error: ${response.status}`, errorData);
      throw new Error(`LlamaIndex API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
  
    return await response.json();
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      // Don't retry authentication errors
      if (error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('authentication failed') ||
          error.message.includes('API key')) {
        return false;
      }
      
      return error.message.includes('429') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503');
    }
  });
}
