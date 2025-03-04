
import { Badge } from "@/components/ui/badge";
import { DocumentChunk } from "@/types/database";

interface DocumentChunkMetadataProps {
  chunk: DocumentChunk;
}

export function DocumentChunkMetadata({ chunk }: DocumentChunkMetadataProps) {
  if (!chunk.metadata || Object.keys(chunk.metadata).length === 0) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t border-muted">
      <h4 className="text-xs font-medium text-muted-foreground mb-1">Chunk Metadata</h4>
      <div className="flex flex-wrap gap-1">
        {Object.entries(chunk.metadata).map(([key, value]) => (
          <Badge key={key} variant="outline" className="text-xs">
            {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
