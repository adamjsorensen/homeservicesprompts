
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { DocumentChunk } from '@/types/database'

// Re-export DocumentChunk from database types
export type { DocumentChunk } from '@/types/database'

export interface ContextResponse {
  content: string
  citations: Array<{
    document_id: string
    context: string
    relevance: number
  }>
  performance?: {
    durationMs: number
    cacheHit?: boolean
    batches?: number
    qualityMetrics?: {
      avgSimilarity: number
      maxSimilarity: number
      minSimilarity: number
    }
  }
}

export interface PerformanceMetrics {
  durationMs: number
  cacheHit: boolean
  status: string
  batches?: number
  qualityMetrics?: {
    avgSimilarity: number
    maxSimilarity: number
    minSimilarity: number
  }
}

interface UseDocumentContextOptions {
  similarityThreshold?: number
  matchCount?: number
  useCaching?: boolean
  batchSize?: number
  trackMetrics?: boolean
}

export function useDocumentContext(options: UseDocumentContextOptions = {}) {
  const { 
    similarityThreshold = 0.7, 
    matchCount = 5, 
    useCaching = true,
    batchSize = 50,
    trackMetrics = true
  } = options
  
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [contextResults, setContextResults] = useState<DocumentChunk[]>([])
  const [resultSource, setResultSource] = useState<'cache' | 'live' | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)

  const retrieveContext = async (query: string, hubArea?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('retrieve-document-context', {
        body: { 
          query, 
          hubArea, 
          similarityThreshold, 
          matchLimit: matchCount,
          useCaching,
          batchSize,
          trackMetrics,
          userId: user?.id
        }
      })

      if (error) throw error
      
      // Set the performance metrics
      if (data.performance) {
        setPerformanceMetrics({
          durationMs: data.performance.durationMs,
          cacheHit: data.performance.cacheHit || false,
          status: 'success',
          batches: data.performance.batches,
          qualityMetrics: data.performance.qualityMetrics
        })
      }
      
      // Set the result source based on cache property
      setResultSource(data.fromCache ? 'cache' : 'live')
      
      // Standardize the results
      const standardizedResults = (data.chunks || data).map((chunk: any) => ({
        ...chunk,
        chunk_id: chunk.id, // Ensure chunk_id exists for backward compatibility
        document_title: chunk.document?.title || '',
        hub_areas: chunk.document?.hub_areas || [],
        relevance_score: chunk.similarity || 0
      })) as DocumentChunk[]
      
      setContextResults(standardizedResults)
      return standardizedResults
    } catch (err) {
      console.error('Error retrieving context:', err)
      setPerformanceMetrics({
        durationMs: 0,
        cacheHit: false,
        status: 'error'
      })
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
    try {
      const { data, error } = await supabase.functions.invoke('generate-response-with-context', {
        body: { 
          query, 
          contextChunks, 
          hubArea,
          userId: user?.id,
          trackMetrics
        }
      })

      if (error) throw error
      
      // Update performance metrics if available
      if (data.performance) {
        setPerformanceMetrics(prev => ({
          ...prev,
          generationDurationMs: data.performance.durationMs
        }))
      }
      
      return data as ContextResponse
    } catch (err) {
      console.error('Error generating response:', err)
      throw err
    }
  }

  // For backwards compatibility, we expose both the mutation version and direct state
  return {
    // State variables for traditional use
    isLoading,
    contextResults,
    resultSource,
    performanceMetrics,
    
    // Mutation versions for React Query
    retrieveContext: useMutation({
      mutationFn: (params: { query: string, hubArea?: string }) => 
        retrieveContext(params.query, params.hubArea)
    }),
    generateResponse: useMutation({
      mutationFn: generateResponse
    })
  }
}

// For backwards compatibility with components importing 'DocumentContext'
export type DocumentContext = ReturnType<typeof useDocumentContext>
