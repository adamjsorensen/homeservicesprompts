
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const HUB_AREAS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'production', label: 'Production' },
  { value: 'team', label: 'Team' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'financials', label: 'Financials' },
  { value: 'leadership', label: 'Leadership' },
]

const FILE_TYPES = [
  { value: 'txt', label: 'Text (TXT)' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'doc', label: 'Word Document (DOC)' },
  { value: 'docx', label: 'Word Document (DOCX)' },
]

export function DocumentUpload() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fileType, setFileType] = useState('txt')
  const [selectedHubAreas, setSelectedHubAreas] = useState<string[]>(['marketing'])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleHubAreaToggle = (hubArea: string) => {
    setSelectedHubAreas(current => 
      current.includes(hubArea)
        ? current.filter(area => area !== hubArea)
        : [...current, hubArea]
    )
  }

  const handleUpload = async () => {
    if (selectedHubAreas.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one hub area",
      })
      return
    }

    try {
      setIsUploading(true)

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          title,
          content,
          fileType,
          hubAreas: selectedHubAreas,
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
      setFileType('txt')
      setSelectedHubAreas(['marketing'])
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
        <Label htmlFor="fileType">File Type</Label>
        <Select value={fileType} onValueChange={setFileType}>
          <SelectTrigger>
            <SelectValue placeholder="Select file type" />
          </SelectTrigger>
          <SelectContent>
            {FILE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="space-y-2">
        <Label>Hub Areas</Label>
        <div className="grid grid-cols-2 gap-2">
          {HUB_AREAS.map((hub) => (
            <div key={hub.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`hub-${hub.value}`}
                checked={selectedHubAreas.includes(hub.value)}
                onCheckedChange={() => handleHubAreaToggle(hub.value)}
              />
              <Label htmlFor={`hub-${hub.value}`} className="cursor-pointer">
                {hub.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleUpload} 
        disabled={isUploading || !title || !content || selectedHubAreas.length === 0}
      >
        {isUploading ? "Processing..." : "Upload Document"}
      </Button>
    </div>
  )
}
