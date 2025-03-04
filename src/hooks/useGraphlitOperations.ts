
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentChunk, Document, GraphlitProcessingResult, ProcessingOptions } from '@/types/documentTypes';
import { Json } from '@/integrations/supabase/types';

interface GraphlitSearchParams {
  query: string;
  hubArea?: string;
  similarityThreshold?: number;
  matchLimit?: number;
  filters?: Record<string, any>;
}

interface GraphlitChunkResult {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, any>;
  chunk_index: number;
  similarity: number;
  graphlit_chunk_id: string;
  document?: {
    id: string;
    title: string;
    file_type: string;
    hub_areas: string[];
  };
}

export function useGraphlitOperations() {
  /**
   * Search for relevant document chunks using Graphlit
   */
  const searchDocuments = async (params: GraphlitSearchParams): Promise<GraphlitChunkResult[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('retrieve-document-context-graphlit', {
        body: {
          query: params.query,
          hubArea: params.hubArea,
          similarityThreshold: params.similarityThreshold || 0.7,
          matchLimit: params.matchLimit || 5,
          filters: params.filters || {}
        }
      });

      if (error) throw error;
      
      return data.chunks || [];
    } catch (err) {
      console.error('Error searching documents with Graphlit:', err);
      throw err;
    }
  };

  /**
   * Get document details including chunk count and metadata
   */
  const getDocumentDetails = async (documentId: string): Promise<Document & { chunks: DocumentChunk[] }> => {
    try {
      // Fetch document
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
        
      if (documentError) throw documentError;
      
      // Fetch document chunks
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });
        
      if (chunksError) throw chunksError;
      
      // Convert Json metadata to proper Record<string, any> type
      const typedChunks: DocumentChunk[] = (chunks || []).map(chunk => ({
        ...chunk,
        metadata: chunk.metadata as Record<string, any> || {},
      }));
      
      return {
        ...document,
        metadata: document.metadata as Record<string, any> || {},
        chunks: typedChunks
      };
    } catch (err) {
      console.error('Error fetching document details:', err);
      throw err;
    }
  };

  /**
   * Reprocess an existing document with updated options
   */
  const reprocessDocument = useMutation({
    mutationFn: async (documentId: string): Promise<{ success: boolean; batch_id: string }> => {
      try {
        // First get document content
        const { data: document, error: documentError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();
          
        if (documentError) throw documentError;
        
        const docMetadata = document.metadata as Record<string, any> || {};
        
        // Call the reprocessing endpoint
        const { data, error } = await supabase.functions.invoke('process-document-graphlit', {
          body: {
            documentId,
            title: document.title,
            content: document.content,
            fileType: document.file_type,
            hubAreas: document.hub_areas,
            metadata: {
              original_doc_id: documentId,
              reprocessed: true,
              previous_processor: docMetadata.processor || 'unknown'
            },
            processingOptions: {
              chunkSize: 1000,
              chunkOverlap: 200,
              splitByHeading: true,
              hierarchical: true
            }
          }
        });
        
        if (error) throw error;
        
        return {
          success: data.success,
          batch_id: data.batch_id
        };
      } catch (err) {
        console.error('Error reprocessing document with Graphlit:', err);
        throw err;
      }
    }
  });

  /**
   * Delete a document and all associated chunks from Graphlit and the database
   */
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string): Promise<{ success: boolean }> => {
      try {
        // Get document details to check for Graphlit ID
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('graphlit_doc_id')
          .eq('id', documentId)
          .single();
          
        if (docError) throw docError;
        
        // If we have a Graphlit document ID, call Graphlit API to delete it
        if (document.graphlit_doc_id) {
          try {
            await supabase.functions.invoke('delete-graphlit-document', {
              body: { graphlitDocId: document.graphlit_doc_id }
            });
          } catch (graphlitError) {
            console.error('Error deleting document from Graphlit:', graphlitError);
            // Continue with local deletion even if Graphlit deletion fails
          }
        }
        
        // Delete document chunks first (for foreign key constraints)
        const { error: chunksError } = await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId);
          
        if (chunksError) throw chunksError;
        
        // Delete the document
        const { error: documentError } = await supabase
          .from('documents')
          .delete()
          .eq('id', documentId);
          
        if (documentError) throw documentError;
        
        return { success: true };
      } catch (err) {
        console.error('Error deleting document:', err);
        throw err;
      }
    }
  });

  return {
    searchDocuments: useMutation({
      mutationFn: searchDocuments
    }),
    getDocumentDetails: useMutation({
      mutationFn: getDocumentDetails
    }),
    reprocessDocument,
    deleteDocument
  };
}
