
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

export function DocumentUpload() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async () => {
    try {
      setIsUploading(true)

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          title,
          content,
          fileType: 'txt', // For now, we'll just handle text
          hubAreas: ['marketing'], // We'll make this dynamic later
        },
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Document uploaded and processed successfully",
      })

      // Reset form
      setTitle('')
      setContent('')
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter or paste document content"
          className="min-h-[200px]"
        />
      </div>

      <Button 
        onClick={handleUpload} 
        disabled={isUploading || !title || !content}
      >
        {isUploading ? "Processing..." : "Upload Document"}
      </Button>
    </div>
  )
}
