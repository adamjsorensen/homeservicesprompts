
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
import { Progress } from "@/components/ui/progress"

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
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
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
      setIsProcessing(true)
      setProcessingProgress(10)

      // Use the new LlamaIndex processor
      const { data, error } = await supabase.functions.invoke('process-document-llamaindex', {
        body: {
          title,
          content,
          fileType,
          hubAreas: selectedHubAreas,
          metadata: {
            processed_by: "llamaindex",
            source_type: "manual_upload"
          },
        },
      })

      if (error) throw error
      
      setProcessingProgress(100)

      toast({
        title: "Success",
        description: `Document uploaded and processed successfully with ${data.chunks_count} chunks created`,
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
      setTimeout(() => {
        setIsUploading(false)
        setIsProcessing(false)
        setProcessingProgress(0)
      }, 1000) // Keep progress bar visible briefly
    }
  }

  // Simulate progress during processing
  // In a real app, you might get actual progress from the backend
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isProcessing && processingProgress < 90) {
      interval = setInterval(() => {
        setProcessingProgress(prev => {
          const increment = Math.random() * 10
          return Math.min(prev + increment, 90)
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, processingProgress])

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

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Processing document...</Label>
            <span className="text-sm text-muted-foreground">{Math.round(processingProgress)}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={isUploading || !title || !content || selectedHubAreas.length === 0}
      >
        {isUploading ? "Processing..." : "Upload Document"}
      </Button>
    </div>
  )
}
