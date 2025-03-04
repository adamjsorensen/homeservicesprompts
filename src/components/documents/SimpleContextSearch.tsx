
import { useState, useCallback } from 'react'
import { useDocumentContext } from '@/hooks/useDocumentContext'
import { DocumentPerformanceMetrics } from './DocumentPerformanceMetrics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SimpleContextSearchProps {
  onSearchComplete?: (hasResults: boolean) => void
  hubArea?: string
  defaultQuery?: string
}

export function SimpleContextSearch({
  onSearchComplete,
  hubArea,
  defaultQuery = ''
}: SimpleContextSearchProps) {
  const [queryText, setQueryText] = useState(defaultQuery)
  
  const { 
    isLoading, 
    resultSource, 
    performanceMetrics,
    selectedContexts,
    retrieveContext 
  } = useDocumentContext({
    similarityThreshold: 0.7,
    matchCount: 5,
    useCaching: true,
    showDetailedResults: false // Don't need detailed results for simplified UI
  })

  const handleSearch = useCallback(async () => {
    if (!queryText.trim()) return
    
    try {
      await retrieveContext.mutateAsync({ 
        query: queryText, 
        hubArea 
      })
      
      // Notify parent component if callback provided
      if (onSearchComplete) {
        onSearchComplete(selectedContexts.length > 0)
      }
    } catch (error) {
      console.error('Error retrieving context:', error)
      // Notify parent component of failure
      if (onSearchComplete) {
        onSearchComplete(false)
      }
    }
  }, [queryText, hubArea, retrieveContext, selectedContexts, onSearchComplete])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for relevant knowledge..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
          />
        </div>
        
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !queryText.trim()}
          size="sm"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>
      
      {selectedContexts.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-sm">
              <span className="font-medium">{selectedContexts.length}</span> context sources found
            </p>
            {resultSource && (
              <Badge variant="outline" className="text-xs">
                {resultSource === 'cache' ? 'From cache' : 'Live search'}
              </Badge>
            )}
          </div>
          
          {performanceMetrics && (
            <DocumentPerformanceMetrics metrics={performanceMetrics} />
          )}
        </div>
      )}
      
      {retrieveContext.isSuccess && selectedContexts.length === 0 && (
        <div className="p-4 text-center border rounded-md">
          <p className="text-muted-foreground">No relevant context found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different search query or contact your administrator.
          </p>
        </div>
      )}
    </div>
  )
}
