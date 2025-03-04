
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/documents/DocumentUpload"
import { DocumentList } from "@/components/documents/DocumentList"

export default function AdminDocuments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
        <p className="text-muted-foreground">
          Upload and manage documents for content generation
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="list">Document Library</TabsTrigger>
          <TabsTrigger value="upload">Upload New Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-0">
          <DocumentList />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-0">
          <div className="max-w-2xl mx-auto">
            <DocumentUpload />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
