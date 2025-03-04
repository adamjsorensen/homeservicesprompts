
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { DocumentChunk, BatchProcessingStatus } from '@/types/database'
import { useGraphlitOperations } from './useGraphlitOperations'

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
  generationDurationMs?: number
  clientDuration?: number
  qualityMetrics?: {
    avgSimilarity: number
    maxSimilarity: number
    minSimilarity: number
  }
  resourceUsage?: {
    tokens?: number
    embeddingCost?: number
    generationCost?: number
  }
  error?: string
}

interface UseDocumentContextOptions {
  similarityThreshold?: number
  matchCount?: number
  useCaching?: boolean
  batchSize?: number
  trackMetrics?: boolean
  hubSpecificWeighting?: boolean
  accessLevel?: string
  showDetailedResults?: boolean
  useGraphlit?: boolean
}

export function useDocumentContext(options: UseDocumentContextOptions = {}) {
  const { 
    similarityThreshold = 0.7, 
    matchCount = 5, 
    useCaching = true,
    batchSize = 50,
    trackMetrics = true,
    hubSpecificWeighting = false,
    accessLevel = 'read',
    showDetailedResults = false,
    useGraphlit = true // Default to Graphlit
  } = options
  
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [contextResults, setContextResults] = useState<DocumentChunk[]>([])
  const [resultSource, setResultSource] = useState<'cache' | 'live' | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [selectedContexts, setSelectedContexts] = useState<DocumentChunk[]>([])
  const { searchDocuments } = useGraphlitOperations()

  const retrieveContext = async (query: string, hubArea?: string) => {
    setIsLoading(true)
    const startTime = performance.now()
    
    try {
      // Always use Graphlit for retrieval
      const { data, error } = await supabase.functions.invoke('retrieve-document-context-graphlit', {
        body: { 
          query, 
          hubArea, 
          similarityThreshold, 
          matchLimit: matchCount,
          useCaching,
          batchSize,
          trackMetrics,
          hubSpecificWeighting,
          accessLevel,
          userId: user?.id
        }
      })

      if (error) throw error
      
      // Calculate client-side processing time
      const clientDuration = performance.now() - startTime
      
      // Set the performance metrics
      if (data.performance) {
        setPerformanceMetrics({
          durationMs: data.performance.durationMs,
          cacheHit: data.performance.cacheHit || false,
          status: 'success',
          batches: data.performance.batches,
          qualityMetrics: data.performance.qualityMetrics,
          resourceUsage: data.performance.resourceUsage,
          // Add client-side processing time
          clientDuration: Math.round(clientDuration)
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
      
      // Store results
      setContextResults(standardizedResults)
      
      // Automatically select the best contexts
      const autoSelectedContexts = standardizedResults
        .filter(chunk => chunk.relevance_score >= similarityThreshold)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, matchCount);
      
      setSelectedContexts(autoSelectedContexts);
      
      return standardizedResults
    } catch (err) {
      console.error('Error retrieving context:', err)
      setPerformanceMetrics({
        durationMs: 0,
        cacheHit: false,
        status: 'error',
        error: (err as Error).message
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateResponse = async ({ query, hubArea }: {
    query: string
    contextChunks?: DocumentChunk[] // Now optional as we use auto-selected contexts
    hubArea?: string
  }) => {
    try {
      // Always use the auto-selected contexts
      const { data, error } = await supabase.functions.invoke('generate-response-with-context', {
        body: { 
          query, 
          contextChunks: selectedContexts, // Use auto-selected contexts
          hubArea,
          userId: user?.id,
          trackMetrics,
          hubSpecificWeighting
        }
      })

      if (error) throw error
      
      // Update performance metrics if available
      if (data.performance) {
        setPerformanceMetrics(prev => ({
          ...prev,
          generationDurationMs: data.performance.durationMs,
          resourceUsage: {
            ...prev?.resourceUsage,
            ...data.performance.resourceUsage
          }
        }))
      }
      
      return data as ContextResponse
    } catch (err) {
      console.error('Error generating response:', err)
      throw err
    }
  }

  // Get document processing batches for monitoring
  const getBatchStatus = async (batchId: string): Promise<BatchProcessingStatus | null> => {
    try {
      // Use the RPC function to get batch status
      const { data, error } = await supabase.functions.invoke('get-batch-status', {
        body: { batchId }
      })
      
      if (error) throw error
      return data as BatchProcessingStatus
    } catch (err) {
      console.error('Error fetching batch status:', err)
      return null
    }
  }

  // For backwards compatibility, we expose both the mutation version and direct state
  return {
    // State variables for traditional use
    isLoading,
    contextResults: showDetailedResults ? contextResults : [], // Only expose full results when needed
    resultSource,
    performanceMetrics,
    selectedContexts, // Expose auto-selected contexts
    
    // Mutation versions for React Query
    retrieveContext: useMutation({
      mutationFn: (params: { query: string, hubArea?: string }) => 
        retrieveContext(params.query, params.hubArea)
    }),
    generateResponse: useMutation({
      mutationFn: generateResponse
    }),
    getBatchStatus: useMutation({
      mutationFn: getBatchStatus
    })
  }
}

// For backwards compatibility with components importing 'DocumentContext'
export type DocumentContext = ReturnType<typeof useDocumentContext>
