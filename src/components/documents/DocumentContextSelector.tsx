
import { useState, useEffect, useMemo } from 'react';
import { useDocumentContext, type DocumentChunk } from '@/hooks/useDocumentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchIcon, RefreshCw, Database, Clock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface DocumentContextSelectorProps {
  hubArea?: string;
  promptText: string;
  onContextChange: (context: DocumentChunk[]) => void;
}

export function DocumentContextSelector({ 
  hubArea, 
  promptText, 
  onContextChange 
}: DocumentContextSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(promptText || '');
  const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());
  const [autoSearchComplete, setAutoSearchComplete] = useState(false);
  
  const documentContext = useDocumentContext({
    similarityThreshold: 0.65,
    matchCount: 8,
    useCached: true
  });
  
  const { 
    isLoading, 
    contextResults, 
    resultSource, 
    retrieveContext 
  } = documentContext;

  // Auto-search when promptText is provided and non-empty
  useEffect(() => {
    if (promptText && !autoSearchComplete) {
      setSearchQuery(promptText);
      handleSearch(promptText);
      setAutoSearchComplete(true);
    }
  }, [promptText, autoSearchComplete]);

  // Handle search submission
  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    await retrieveContext.mutateAsync({ query, hubArea });
    // Auto-select all results on new search
    if (contextResults.length > 0) {
      const newIds = new Set(contextResults.map(result => result.id));
      setSelectedContextIds(newIds);
      updateSelectedContext(newIds);
    }
  };

  // Handle context selection changes
  const handleContextSelection = (chunkId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedContextIds);
    
    if (isSelected) {
      newSelection.add(chunkId);
    } else {
      newSelection.delete(chunkId);
    }
    
    setSelectedContextIds(newSelection);
    updateSelectedContext(newSelection);
  };

  // Update parent component with selected context
  const updateSelectedContext = (selectedIds: Set<string>) => {
    const selectedContext = contextResults.filter(
      result => selectedIds.has(result.id)
    );
    onContextChange(selectedContext);
  };

  // Compute selected context data
  const selectedContextData = useMemo(() => {
    const selected = contextResults.filter(
      result => selectedContextIds.has(result.id)
    );
    
    return {
      count: selected.length,
      totalWords: selected.reduce(
        (sum, context) => sum + context.content.split(/\s+/).length, 
        0
      ),
      documents: new Set(selected.map(ctx => ctx.document_id)).size,
      averageRelevance: selected.length > 0 
        ? selected.reduce((sum, ctx) => sum + (ctx.relevance_score || ctx.similarity), 0) / selected.length 
        : 0
    };
  }, [contextResults, selectedContextIds]);

  // Format relevance score for display
  const formatRelevanceScore = (score: number) => {
    return (score * 100).toFixed(0) + '%';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search for relevant document context..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSearch()}
            disabled={isLoading || !searchQuery.trim()}
            variant="secondary"
          >
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </div>
        {resultSource && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Badge variant="outline" className="mr-2">
              {resultSource === 'cache' ? 
                <><Clock className="mr-1 h-3 w-3" /> Cached</> : 
                <><Database className="mr-1 h-3 w-3" /> Live Query</>
              }
            </Badge>
            Found {contextResults.length} relevant context snippets
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-2">
            Searching for relevant document context...
          </div>
          <Progress value={60} className="w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border border-muted">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : contextResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Card className="bg-muted/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Selected</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{selectedContextData.count} / {contextResults.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Words</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{selectedContextData.totalWords}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{selectedContextData.documents}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Avg. Relevance</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold">{formatRelevanceScore(selectedContextData.averageRelevance)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-md">
            <ScrollArea className="h-[300px] rounded-md">
              <div className="p-4 space-y-4">
                {contextResults.map((context) => (
                  <Card 
                    key={context.id} 
                    className={`border ${selectedContextIds.has(context.id) ? 'border-primary/50' : 'border-muted'}`}
                  >
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {context.document?.title || context.document_title}
                        </CardTitle>
                        <CardDescription className="text-xs flex flex-wrap gap-1 mt-1">
                          {(context.document?.hub_areas || context.hub_areas || []).map(area => (
                            <Badge key={area} variant="secondary" className="text-xs capitalize">
                              {area}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs">
                            Relevance: {formatRelevanceScore(context.relevance_score || context.similarity)}
                          </Badge>
                        </CardDescription>
                      </div>
                      <Checkbox 
                        checked={selectedContextIds.has(context.id)}
                        onCheckedChange={(checked) => {
                          handleContextSelection(context.id, !!checked);
                        }}
                      />
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-4 pt-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {context.content.length > 300 
                          ? context.content.substring(0, 300) + '...' 
                          : context.content
                        }
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      ) : autoSearchComplete ? (
        <div className="border rounded-md p-8 text-center bg-muted/30">
          <FileText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No relevant documents found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search query or upload more documents to the library.
          </p>
          <Button variant="outline" onClick={() => handleSearch(promptText)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center bg-muted/30">
          <SearchIcon className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Search for relevant documents</h3>
          <p className="text-muted-foreground mb-4">
            Use the search bar above to find documents relevant to your prompt.
          </p>
          <Button onClick={() => handleSearch(promptText)}>
            <SearchIcon className="mr-2 h-4 w-4" />
            Search Now
          </Button>
        </div>
      )}
    </div>
  );
}
