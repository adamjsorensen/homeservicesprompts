
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useDocumentSearch } from '@/hooks/useDocumentSearch'
import { Badge } from '@/components/ui/badge'

interface DocumentContextProps {
  query: string
  hubArea?: string
  onAddContext: (context: string) => void
}

export function DocumentContext({ query, hubArea, onAddContext }: DocumentContextProps) {
  const { searchDocuments, results, loading } = useDocumentSearch()
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  useEffect(() => {
    if (query && query.length > 10) {
      const delaySearch = setTimeout(() => {
        searchDocuments(query, hubArea)
      }, 500)
      return () => clearTimeout(delaySearch)
    }
  }, [query, hubArea])

  if (!query || query.length <= 10) {
    return null
  }

  const handleAddContext = (content: string, id: string) => {
    onAddContext(content)
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          Relevant Documents {loading && <span className="text-muted-foreground">(searching...)</span>}
        </h3>
        {results.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => searchDocuments(query, hubArea)}
          >
            Refresh
          </Button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map(doc => (
            <div 
              key={doc.id} 
              className="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{doc.title}</h4>
                  <Badge variant="outline" className="uppercase text-xs">
                    {doc.file_type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(doc.similarity * 100)}% match
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {doc.hub_areas.map(area => (
                  <Badge key={area} variant="secondary" className="text-xs capitalize">
                    {area}
                  </Badge>
                ))}
              </div>

              <div className="mb-2">
                {expandedDoc === doc.id ? (
                  <div className="text-sm">
                    <p className="whitespace-pre-wrap">{doc.content}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setExpandedDoc(null)}
                      className="mt-2"
                    >
                      Collapse
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm truncate">
                    {doc.content.substring(0, 150)}...
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setExpandedDoc(doc.id)}
                      className="ml-1"
                    >
                      Expand
                    </Button>
                  </p>
                )}
              </div>

              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleAddContext(doc.content, doc.id)}
              >
                Use as Context
              </Button>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No relevant documents found
        </div>
      )}
    </div>
  )
}
