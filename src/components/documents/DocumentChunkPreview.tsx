
import { Badge } from '@/components/ui/badge'
import { DocumentChunk } from '@/types/database'

interface DocumentChunkPreviewProps {
  chunk: DocumentChunk;
}

export function DocumentChunkPreview({ chunk }: DocumentChunkPreviewProps) {
  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline">Chunk {chunk.chunk_index + 1}</Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(chunk.created_at).toLocaleString()}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
      {chunk.metadata && (
        <div className="mt-2 pt-2 border-t border-muted text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            {Object.entries(chunk.metadata).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
