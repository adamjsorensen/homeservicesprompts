
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Document, ProcessingOptions } from "@/types/documentTypes";
import { useToast } from "@/components/ui/use-toast";
import { useGraphlitOperations } from "@/hooks/useGraphlitOperations";
import { Loader2 } from "lucide-react";

interface GraphlitDocumentInfoProps {
  document: Document;
  onUpdate?: () => void;
}

export function GraphlitDocumentInfo({ document, onUpdate }: GraphlitDocumentInfoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { reprocessDocument } = useGraphlitOperations();

  const handleReprocess = async () => {
    if (!document.id) return;
    
    setIsLoading(true);
    try {
      // Fix the processing options to match the correct type
      const options: ProcessingOptions = {
        chunkSize: 1000,
        chunkOverlap: 200,
        splitByHeading: true,
        hierarchical: true
      };
      
      await reprocessDocument.mutateAsync(document.id, {
        onSuccess: () => {
          if (onUpdate) onUpdate();
        }
      });
      
      toast({
        title: "Document Reprocessing Started",
        description: "The document is being reprocessed with Graphlit. This may take a few minutes.",
      });
      
    } catch (error) {
      console.error("Error reprocessing document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reprocess document. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProcessorBadge = () => {
    const processor = document.metadata?.processor || '';
    
    if (processor.toLowerCase().includes('graphlit')) {
      return <Badge className="bg-blue-500">Graphlit</Badge>;
    } else if (processor.toLowerCase().includes('llamaindex')) {
      return <Badge className="bg-amber-500">LlamaIndex (Legacy)</Badge>;
    } else {
      return <Badge>Unknown</Badge>;
    }
  };

  const chunksCount = document.metadata?.chunks_count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Processing Information</span>
          {getProcessorBadge()}
        </CardTitle>
        <CardDescription>
          {document.graphlit_doc_id ? 
            `Processed with Graphlit (ID: ${document.graphlit_doc_id.substring(0, 8)}...)` : 
            "Processing information not available"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Chunks</h4>
          <p className="text-sm">{chunksCount} document chunks created</p>
        </div>
        
        {document.metadata?.processing_metadata && (
          <div>
            <h4 className="text-sm font-medium mb-1">Processing Options</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Chunk Size: {document.metadata.processing_metadata.chunk_size || 'Default'}</p>
              <p>Chunk Overlap: {document.metadata.processing_metadata.chunk_overlap || 'Default'}</p>
              <p>Split by Headings: {document.metadata.processing_metadata.split_by_heading ? 'Yes' : 'No'}</p>
              <p>Hierarchical: {document.metadata.processing_metadata.hierarchical ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
        
        {document.metadata?.processed_at && (
          <div>
            <h4 className="text-sm font-medium mb-1">Processed At</h4>
            <p className="text-sm">
              {new Date(document.metadata.processed_at).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReprocess}
          disabled={isLoading || !document.id}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reprocess with Graphlit
        </Button>
      </CardFooter>
    </Card>
  );
}
