
import { DocumentChunk } from '@/hooks/useDocumentContext'
import { 
  Card, 
  CardContent,
  CardFooter, 
  CardHeader 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, File, Plus } from 'lucide-react'
import { DocumentChunkMetadata } from './DocumentChunkMetadata'

interface DocumentChunkPreviewProps {
  chunk: DocumentChunk
  isSelected?: boolean
  onSelect?: () => void
  showFullContent?: boolean
}

export function DocumentChunkPreview({
  chunk,
  isSelected = false,
  onSelect,
  showFullContent = false
}: DocumentChunkPreviewProps) {
  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    return <File className="h-4 w-4" />
  }
  
  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength || showFullContent) return content
    return content.substring(0, maxLength) + '...'
  }
  
  // Format similarity score as percentage
  const formatSimilarity = (score: number) => {
    return `${(score * 100).toFixed(1)}%`
  }
  
  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 text-green-900'
    if (score >= 0.8) return 'bg-green-50 text-green-800'
    if (score >= 0.7) return 'bg-yellow-50 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }
  
  // Get document title and metadata
  const documentTitle = chunk.document?.title || chunk.document_title || 'Unnamed Document'
  const hubAreas = chunk.document?.hub_areas || chunk.hub_areas || []
  const similarity = chunk.similarity || chunk.relevance_score || 0
  
  return (
    <Card className={`transition-colors ${isSelected ? 'border-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {getFileIcon(chunk.document?.file_type || 'txt')}
          <span className="font-medium truncate max-w-[200px]" title={documentTitle}>
            {documentTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getSimilarityColor(similarity)}>
            Match: {formatSimilarity(similarity)}
          </Badge>
          {hubAreas.length > 0 && (
            <Badge variant="secondary">{hubAreas[0]}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm whitespace-pre-line">
          {truncateContent(chunk.content)}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between py-2">
        <DocumentChunkMetadata 
          chunk={chunk} 
          showPosition={true}
        />
        {onSelect && (
          <Button 
            size="sm" 
            variant={isSelected ? "default" : "outline"}
            onClick={onSelect}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Selected
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Select
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
