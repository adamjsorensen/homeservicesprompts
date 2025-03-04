
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'

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
  chunk_id?: string // For backwards compatibility
  document_title?: string // For backwards compatibility
  hub_areas?: string[] // For backwards compatibility
  relevance_score?: number // For backwards compatibility
}

export interface ContextResponse {
  content: string
  citations: Array<{
    document_id: string
    context: string
    relevance: number
  }>
}

interface UseDocumentContextOptions {
  similarityThreshold?: number
  matchCount?: number
  useCached?: boolean
}

export function useDocumentContext(options: UseDocumentContextOptions = {}) {
  const { similarityThreshold = 0.7, matchCount = 5, useCached = true } = options
  const [isLoading, setIsLoading] = useState(false)
  const [contextResults, setContextResults] = useState<DocumentChunk[]>([])
  const [resultSource, setResultSource] = useState<'cache' | 'live' | null>(null)

  const retrieveContext = async (query: string, hubArea?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('retrieve-document-context', {
        body: { 
          query, 
          hubArea, 
          similarityThreshold, 
          matchLimit: matchCount,
          useCaching: useCached 
        }
      })

      if (error) throw error
      
      // Set the result source based on a cache property if available
      setResultSource(data.fromCache ? 'cache' : 'live')
      
      // Standardize the results
      const standardizedResults = (data as DocumentChunk[]).map(chunk => ({
        ...chunk,
        chunk_id: chunk.id, // Ensure chunk_id exists for backward compatibility
        document_title: chunk.document?.title || '',
        hub_areas: chunk.document?.hub_areas || [],
        relevance_score: chunk.similarity || 0
      }))
      
      setContextResults(standardizedResults)
      return standardizedResults
    } catch (err) {
      console.error('Error retrieving context:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
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
    isLoading,
    contextResults,
    resultSource,
    retrieveContext: useMutation({
      mutationFn: (params: { query: string, hubArea?: string }) => 
        retrieveContext(params.query, params.hubArea)
    }),
    generateResponse: useMutation({
      mutationFn: generateResponse
    })
  }
}
