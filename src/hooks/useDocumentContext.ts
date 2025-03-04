
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  chunk_index: number
  similarity: number
  document: {
    id: string
    title: string
    file_type: string
    hub_areas: string[]
  }
}

export interface ContextResponse {
  content: string
  citations: Array<{
    document_id: string
    context: string
    relevance: number
  }>
}

export function useDocumentContext() {
  const retrieveContext = async (query: string, hubArea?: string) => {
    const { data, error } = await supabase.functions.invoke('retrieve-document-context', {
      body: { query, hubArea, similarityThreshold: 0.7, matchLimit: 5 }
    })

    if (error) throw error
    return data as DocumentChunk[]
  }

  const generateResponse = async ({ query, contextChunks, hubArea }: {
    query: string
    contextChunks: DocumentChunk[]
    hubArea?: string
  }) => {
    const { data, error } = await supabase.functions.invoke('generate-response-with-context', {
      body: { query, contextChunks, hubArea }
    })

    if (error) throw error
    return data as ContextResponse
  }

  return {
    retrieveContext: useMutation({
      mutationFn: ({ query, hubArea }: { query: string, hubArea?: string }) => 
        retrieveContext(query, hubArea)
    }),
    generateResponse: useMutation({
      mutationFn: generateResponse
    })
  }
}
