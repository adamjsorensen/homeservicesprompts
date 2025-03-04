
import { DocumentChunk } from '@/types/database'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'

interface DocumentChunkMetadataProps {
  chunk: DocumentChunk
  showPosition?: boolean
}

export function DocumentChunkMetadata({ 
  chunk,
  showPosition = false
}: DocumentChunkMetadataProps) {
  const metadata = chunk.metadata || {}
  const position = showPosition ? `Chunk ${chunk.chunk_index + 1}` : null
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <InfoIcon className="h-4 w-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Chunk Metadata</h4>
          
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="text-muted-foreground">ID:</div>
            <div className="truncate">{chunk.id}</div>
            
            <div className="text-muted-foreground">Document ID:</div>
            <div className="truncate">{chunk.document_id}</div>
            
            {position && (
              <>
                <div className="text-muted-foreground">Position:</div>
                <div>{position}</div>
              </>
            )}
            
            <div className="text-muted-foreground">Similarity:</div>
            <div>{((chunk.similarity || chunk.relevance_score || 0) * 100).toFixed(2)}%</div>
            
            {Object.entries(metadata).map(([key, value]) => (
              key !== 'position' && (
                <>
                  <div key={`key-${key}`} className="text-muted-foreground">
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </div>
                  <div key={`value-${key}`}>
                    {typeof value === 'object' 
                      ? JSON.stringify(value) 
                      : String(value)
                    }
                  </div>
                </>
              )
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
