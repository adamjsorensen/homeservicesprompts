
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/documents/DocumentUpload"
import { DocumentList } from "@/components/documents/DocumentList"
import { DocumentConfigPanel } from "@/components/documents/DocumentConfigPanel"
import { DocumentMetricsPanel } from "@/components/documents/DocumentMetricsPanel"
import { DocumentAccessControl } from "@/components/documents/DocumentAccessControl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Document } from "@/types/documentTypes"

export default function AdminDocuments() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("settings")

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document)
    setConfigDialogOpen(true)
  }

  const handleDocumentUpdate = () => {
    // Refresh document list after updates
    setConfigDialogOpen(false)
    // The DocumentList component has its own refresh mechanism
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
        <p className="text-muted-foreground">
          Upload and manage documents for RAG content generation with LlamaIndex
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="list">Document Library</TabsTrigger>
          <TabsTrigger value="upload">Upload New Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-0">
          <DocumentList onConfigureDocument={handleDocumentSelect} />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-0">
          <div className="max-w-2xl mx-auto">
            <DocumentUpload />
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Configuration Dialog */}
      {selectedDocument && (
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedDocument.title}</DialogTitle>
              <DialogDescription>
                Configure document settings and access controls
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="access">Access Control</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 flex-1 overflow-auto p-1">
                <TabsContent value="settings" className="mt-0">
                  <DocumentConfigPanel 
                    document={selectedDocument} 
                    onUpdate={handleDocumentUpdate} 
                  />
                </TabsContent>
                
                <TabsContent value="metrics" className="mt-0">
                  <DocumentMetricsPanel documentId={selectedDocument.id} />
                </TabsContent>
                
                <TabsContent value="access" className="mt-0">
                  <DocumentAccessControl documentId={selectedDocument.id} />
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
