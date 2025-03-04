
import { DocumentUpload } from "@/components/documents/DocumentUpload"

export default function AdminDocuments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
        <p className="text-muted-foreground">
          Upload and manage documents for content generation
        </p>
      </div>

      <div className="grid gap-6">
        <DocumentUpload />
      </div>
    </div>
  )
}
