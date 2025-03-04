
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentChunk } from '@/types/database'
import { DocumentChunkPreview } from './DocumentChunkPreview'

interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  hub_areas: string[];
  created_at: string;
  updated_at: string;
  chunks_count?: number;
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loadingChunks, setLoadingChunks] = useState(false)
  const { toast } = useToast()

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (documentsError) throw documentsError

      // Fetch chunk counts for each document
      const documentsWithChunks = await Promise.all(
        (documentsData || []).map(async (doc) => {
          // Using a direct query instead of RPC function for chunk counting
          const { count, error } = await supabase
            .from('document_chunks')
            .select('id', { count: 'exact', head: true })
            .eq('document_id', doc.id)

          return {
            ...doc,
            chunks_count: error ? 0 : count
          }
        })
      )

      setDocuments(documentsWithChunks || [])
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

  const handlePreview = async (document: Document) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
    
    // Load chunks for this document
    try {
      setLoadingChunks(true)
      // Using a direct query instead of RPC function to get document chunks
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', document.id)
        .order('chunk_index', { ascending: true })
      
      if (error) throw error
      setDocumentChunks(data as DocumentChunk[] || [])
    } catch (error) {
      console.error('Error loading chunks:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load document chunks",
      })
      setDocumentChunks([])
    } finally {
      setLoadingChunks(false)
    }
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
                <TableHead>Chunks</TableHead>
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
                  <TableCell>
                    <Badge variant="secondary">
                      {doc.chunks_count || 0}
                    </Badge>
                  </TableCell>
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedDocument.title}</DialogTitle>
              <DialogDescription>
                {formatHubAreas(selectedDocument.hub_areas)}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="content">Full Content</TabsTrigger>
                <TabsTrigger value="chunks">
                  Chunks ({documentChunks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="mt-4 flex-1 overflow-hidden">
                <div className="max-h-[60vh] overflow-auto border rounded-md p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content}</pre>
                </div>
              </TabsContent>
              
              <TabsContent value="chunks" className="mt-4 flex-1 overflow-hidden">
                {loadingChunks ? (
                  <div className="flex justify-center py-8">
                    <p>Loading chunks...</p>
                  </div>
                ) : documentChunks.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 rounded-md">
                    <p className="text-muted-foreground">No chunks found</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-auto p-1">
                    {documentChunks.map((chunk) => (
                      <DocumentChunkPreview key={chunk.id} chunk={chunk} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
