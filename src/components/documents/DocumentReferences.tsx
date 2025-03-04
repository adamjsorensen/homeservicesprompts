
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentContext } from '@/hooks/useDocumentContext';

interface DocumentReferencesProps {
  references: DocumentContext[];
  className?: string;
}

export function DocumentReferences({ references, className = '' }: DocumentReferencesProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!references || references.length === 0) {
    return null;
  }

  // Group references by document for a cleaner display
  const documentGroups = references.reduce<Record<string, DocumentContext[]>>((acc, ref) => {
    if (!acc[ref.document_id]) {
      acc[ref.document_id] = [];
    }
    acc[ref.document_id].push(ref);
    return acc;
  }, {});

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`border rounded-md bg-muted/10 ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Info className="h-4 w-4 mr-2 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            Document Sources ({references.length} references from {Object.keys(documentGroups).length} documents)
          </h3>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <ScrollArea className="max-h-[300px]">
          <div className="p-4 pt-0 space-y-4">
            {Object.entries(documentGroups).map(([docId, refs]) => (
              <Card key={docId} className="p-3 border border-muted">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">{refs[0].document_title}</h4>
                      <div className="flex flex-wrap gap-1">
                        {refs[0].hub_areas.map(area => (
                          <Badge key={area} variant="outline" className="text-xs capitalize">
                            {area}
                          </Badge>
                        ))}
                        <Badge variant="secondary" className="text-xs">
                          {refs.length} excerpt{refs.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {refs.map((ref, index) => (
                        <div key={`${ref.chunk_id}-${index}`} className="text-xs bg-background p-2 rounded-sm">
                          <div className="whitespace-pre-wrap">
                            {ref.citation_context}
                          </div>
                          <div className="mt-1 text-right">
                            <Badge variant="outline" className="text-[10px]">
                              Relevance: {(ref.relevance_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
