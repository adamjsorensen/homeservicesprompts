
import { useState, useCallback } from 'react'
import { useDocumentContext } from '@/hooks/useDocumentContext'
import { DocumentChunk } from '@/types/database'
import { DocumentChunkPreview } from './DocumentChunkPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw, Settings } from 'lucide-react'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Slider 
} from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DocumentPerformanceMetrics } from './DocumentPerformanceMetrics'

interface DocumentContextSelectorProps {
  onContextSelect?: (selectedChunks: DocumentChunk[]) => void
  hubArea?: string
  defaultQuery?: string
}

export function DocumentContextSelector({
  onContextSelect,
  hubArea,
  defaultQuery = ''
}: DocumentContextSelectorProps) {
  const [queryText, setQueryText] = useState(defaultQuery)
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set())
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7)
  const [matchCount, setMatchCount] = useState(5)
  const [useCaching, setUseCaching] = useState(true)
  
  const { 
    isLoading, 
    contextResults, 
    resultSource, 
    performanceMetrics,
    retrieveContext 
  } = useDocumentContext({
    similarityThreshold,
    matchCount,
    useCaching
  })

  const handleSearch = useCallback(async () => {
    if (!queryText.trim()) return
    
    try {
      const results = await retrieveContext.mutateAsync({ 
        query: queryText, 
        hubArea 
      })
      
      // Clear any previous selections
      setSelectedChunkIds(new Set())
      
      // If callback provided, send empty array to reset
      if (onContextSelect) {
        onContextSelect([])
      }
    } catch (error) {
      console.error('Error retrieving context:', error)
    }
  }, [queryText, hubArea, retrieveContext, onContextSelect])

  const toggleChunkSelection = useCallback((chunk: DocumentChunk) => {
    setSelectedChunkIds(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(chunk.id)) {
        newSelection.delete(chunk.id)
      } else {
        newSelection.add(chunk.id)
      }
      
      // If callback provided, send selected chunks
      if (onContextSelect) {
        const selectedChunks = contextResults.filter(c => 
          newSelection.has(c.id)
        )
        onContextSelect(selectedChunks)
      }
      
      return newSelection
    })
  }, [contextResults, onContextSelect])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for context..."
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Search Settings</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="threshold">Similarity Threshold: {similarityThreshold.toFixed(2)}</Label>
                </div>
                <Slider 
                  id="threshold"
                  min={0.1} 
                  max={0.95} 
                  step={0.05} 
                  value={[similarityThreshold]}
                  onValueChange={(vals) => setSimilarityThreshold(vals[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="matchCount">Results Limit: {matchCount}</Label>
                </div>
                <Slider 
                  id="matchCount"
                  min={1} 
                  max={20} 
                  step={1} 
                  value={[matchCount]}
                  onValueChange={(vals) => setMatchCount(vals[0])}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="caching">Use Result Caching</Label>
                <Switch 
                  id="caching" 
                  checked={useCaching}
                  onCheckedChange={setUseCaching}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {contextResults.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Found {contextResults.length} results
            {resultSource && (
              <span className="ml-1">
                (from {resultSource === 'cache' ? 'cache' : 'search'})
              </span>
            )}
          </p>
          <DocumentPerformanceMetrics metrics={performanceMetrics} />
        </div>
      )}
      
      <div className="space-y-2">
        {contextResults.map((chunk) => (
          <DocumentChunkPreview
            key={chunk.id}
            chunk={chunk}
            isSelected={selectedChunkIds.has(chunk.id)}
            onSelect={() => toggleChunkSelection(chunk)}
          />
        ))}
        
        {retrieveContext.isSuccess && contextResults.length === 0 && (
          <div className="p-4 text-center border rounded-md">
            <p className="text-muted-foreground">No relevant context found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
