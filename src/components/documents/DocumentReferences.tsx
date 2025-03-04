
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type ContextResponse } from '@/hooks/useDocumentContext';

interface DocumentReferencesProps {
  response: ContextResponse | null;
  isLoading?: boolean;
}

export function DocumentReferences({ response, isLoading = false }: DocumentReferencesProps) {
  const [openCitations, setOpenCitations] = useState<Set<string>>(new Set());

  const toggleCitation = (id: string) => {
    const newOpenCitations = new Set(openCitations);
    if (newOpenCitations.has(id)) {
      newOpenCitations.delete(id);
    } else {
      newOpenCitations.add(id);
    }
    setOpenCitations(newOpenCitations);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document References</CardTitle>
          <CardDescription>Loading citation information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response || !response.citations || response.citations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document References</CardTitle>
          <CardDescription>No document references were used</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The generated response didn't use any information from uploaded documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort citations by relevance score (highest first)
  const sortedCitations = [...response.citations].sort((a, b) => b.relevance - a.relevance);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Document References</CardTitle>
        <CardDescription>
          This response referenced {sortedCitations.length} document{sortedCitations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="p-4 space-y-3">
            {sortedCitations.map((citation, index) => (
              <Collapsible 
                key={`${citation.document_id}-${index}`}
                open={openCitations.has(citation.document_id)}
                onOpenChange={() => toggleCitation(citation.document_id)}
                className="border rounded-md"
              >
                <div className="flex items-start justify-between p-3">
                  <div className="flex gap-2 items-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Document ID: {citation.document_id.substring(0, 8)}...</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Relevance: {Math.round(citation.relevance * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <Separator />
                  <div className="p-3 text-sm">
                    <p className="font-medium mb-1">Cited Content:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap text-xs">
                      {citation.context}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
