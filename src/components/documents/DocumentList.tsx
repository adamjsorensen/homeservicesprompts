
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Document {
  id: string
  title: string
  content: string
  file_type: string
  hub_areas: string[]
  created_at: string
  updated_at: string
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { toast } = useToast()

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handlePreview = (document: Document) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
  }

  const formatHubAreas = (hubAreas: string[]) => {
    return hubAreas.map(area => 
      <Badge key={area} variant="outline" className="mr-1 capitalize">
        {area}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Uploaded Documents</h2>
        <Button onClick={fetchDocuments} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 bg-muted/50 rounded-md">
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hub Areas</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell className="uppercase">{doc.file_type}</TableCell>
                  <TableCell>{formatHubAreas(doc.hub_areas)}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handlePreview(doc)} variant="ghost" size="sm">
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedDocument && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedDocument.title}</DialogTitle>
              <DialogDescription>
                {formatHubAreas(selectedDocument.hub_areas)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[400px] overflow-auto border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content}</pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
