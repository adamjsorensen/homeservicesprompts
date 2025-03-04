
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentChunk, Document, GraphlitProcessingResult } from '@/types/documentTypes';

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
      
      return {
        ...document,
        chunks: chunks || []
      };
    } catch (err) {
      console.error('Error fetching document details:', err);
      throw err;
    }
  };

  /**
   * Reprocess an existing document with updated options
   */
  const reprocessDocument = async (
    documentId: string, 
    options: { 
      chunkSize?: number; 
      chunkOverlap?: number; 
      splitByHeading?: boolean; 
      hierarchical?: boolean;
    }
  ): Promise<{ success: boolean; batch_id: string }> => {
    try {
      // First get document content
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
        
      if (documentError) throw documentError;
      
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
            previous_processor: document.metadata?.processor || 'unknown'
          },
          processingOptions: options
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
  };

  /**
   * Delete a document and all associated chunks from Graphlit and the database
   */
  const deleteDocument = async (documentId: string, graphlitDocId?: string): Promise<{ success: boolean }> => {
    try {
      // If we have a Graphlit document ID, call Graphlit API to delete it
      if (graphlitDocId) {
        try {
          await supabase.functions.invoke('delete-graphlit-document', {
            body: { graphlitDocId }
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
  };

  return {
    searchDocuments: useMutation({
      mutationFn: searchDocuments
    }),
    getDocumentDetails: useMutation({
      mutationFn: getDocumentDetails
    }),
    reprocessDocument: useMutation({
      mutationFn: reprocessDocument
    }),
    deleteDocument: useMutation({
      mutationFn: deleteDocument
    })
  };
}
