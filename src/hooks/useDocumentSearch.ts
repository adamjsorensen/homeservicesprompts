
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface DocumentSearchResult {
  id: string
  title: string
  content: string
  file_type: string
  hub_areas: string[]
  created_at: string
  similarity: number
}

export const useDocumentSearch = () => {
  const [results, setResults] = useState<DocumentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const searchDocuments = async (query: string, hubArea?: string, threshold = 0.5, limit = 5) => {
    try {
      setLoading(true)
      setError(null)

      // Generate embedding for search query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
        body: { text: query }
      })

      if (embeddingError) throw embeddingError

      // Search for similar documents
      const { data, error: searchError } = await supabase.rpc(
        'match_documents',
        {
          query_embedding: embeddingData.embedding,
          similarity_threshold: threshold,
          match_count: limit,
          filter_hub_area: hubArea
        }
      )

      if (searchError) throw searchError

      setResults(data || [])
      return data
    } catch (err) {
      console.error('Error searching documents:', err)
      setError(err instanceof Error ? err : new Error('An unknown error occurred'))
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    searchDocuments,
    results,
    loading,
    error
  }
}
