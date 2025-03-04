import { useState, useEffect, ChangeEvent } from 'react'
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, FileText, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useBatchProcessing } from '@/hooks/useBatchProcessing'

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
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text')
  const [file, setFile] = useState<File | null>(null)
  const [selectedHubAreas, setSelectedHubAreas] = useState<string[]>(['marketing'])
  const [isUploading, setIsUploading] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { useBatchStatusPolling } = useBatchProcessing()
  const { data: batchStatus } = useBatchStatusPolling(batchId, isProcessing)

  const handleHubAreaToggle = (hubArea: string) => {
    setSelectedHubAreas(current => 
      current.includes(hubArea)
        ? current.filter(area => area !== hubArea)
        : [...current, hubArea]
    )
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        setFileType('pdf');
      } else if (fileName.endsWith('.docx')) {
        setFileType('docx');
      } else if (fileName.endsWith('.doc')) {
        setFileType('doc');
      } else if (fileName.endsWith('.txt')) {
        setFileType('txt');
      }
      
      if (!title) {
        const fileNameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        setTitle(fileNameWithoutExt || selectedFile.name);
      }
    }
  };

  const handleUpload = async () => {
    if (selectedHubAreas.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one hub area",
      })
      return;
    }

    if (uploadMethod === 'text' && !content) {
      setError("Please enter document content");
      return;
    } else if (uploadMethod === 'file' && !file) {
      setError("Please select a file to upload");
      return;
    }

    setError(null);
    setIsUploading(true);
    setIsProcessing(true);
    setProcessingProgress(10);

    try {
      let documentContent = content;
      let isBase64 = false;
      
      if (uploadMethod === 'file' && file) {
        const reader = new FileReader();
        
        if (fileType === 'txt') {
          documentContent = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        } else {
          documentContent = await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          isBase64 = true;
        }
      }

      const { data, error } = await supabase.functions.invoke('process-document-llamaindex', {
        body: {
          title,
          content: documentContent,
          fileType,
          hubAreas: selectedHubAreas,
          metadata: {
            processed_by: "llamaindex",
            source_type: uploadMethod === 'file' ? "file_upload" : "manual_input",
            original_filename: file?.name,
            filesize: file?.size
          },
          isBase64
        },
      })

      if (error) throw error;
      
      if (data.batch_id) {
        setBatchId(data.batch_id);
      }
      
      setProcessingProgress(30);

      toast({
        title: "Document Uploaded",
        description: "Document is now being processed. You'll be notified when complete.",
      });

      setIsProcessing(true);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError("Failed to upload document. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document. Please try again.",
      });
      setIsUploading(false);
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }

  useEffect(() => {
    if (batchStatus) {
      let progress = 30;
      
      if (batchStatus.total_items > 0) {
        progress = 30 + (batchStatus.processed_items / batchStatus.total_items) * 60;
      }
      
      setProcessingProgress(Math.min(90, progress));
      
      if (batchStatus.status === 'completed') {
        setProcessingProgress(100);
        toast({
          title: "Success",
          description: `Document processed successfully with ${batchStatus.processed_items} chunks created`,
        });
        resetForm();
      } else if (batchStatus.status === 'error') {
        setError("Document processing encountered an error.");
        toast({
          variant: "destructive",
          title: "Processing Error",
          description: "An error occurred during document processing.",
        });
        setIsUploading(false);
        setIsProcessing(false);
      }
    }
  }, [batchStatus]);

  const resetForm = () => {
    setTimeout(() => {
      setTitle('');
      setContent('');
      setFileType('txt');
      setSelectedHubAreas(['marketing']);
      setIsUploading(false);
      setIsProcessing(false);
      setProcessingProgress(0);
      setBatchId(null);
      setFile(null);
    }, 2000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isProcessing && processingProgress < 30) {
      interval = setInterval(() => {
        setProcessingProgress(prev => {
          const increment = Math.random() * 5;
          return Math.min(prev + increment, 30);
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, processingProgress]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Method</Label>
        <RadioGroup 
          value={uploadMethod} 
          onValueChange={(value) => setUploadMethod(value as 'text' | 'file')}
          className="flex flex-col space-y-1"
          disabled={isUploading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="r1" />
            <Label htmlFor="r1">Paste Text</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="file" id="r2" />
            <Label htmlFor="r2">Upload File</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileType">File Type</Label>
        <Select value={fileType} onValueChange={setFileType} disabled={isUploading}>
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

      {uploadMethod === 'text' ? (
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter or paste document content"
            className="min-h-[200px]"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              {file ? file.name : "Drag and drop your file here, or click to browse"}
            </p>
            <Input
              id="file"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={`.${fileType}`}
              disabled={isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('file')?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Hub Areas</Label>
        <div className="grid grid-cols-2 gap-2">
          {HUB_AREAS.map((hub) => (
            <div key={hub.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`hub-${hub.value}`}
                checked={selectedHubAreas.includes(hub.value)}
                onCheckedChange={() => handleHubAreaToggle(hub.value)}
                disabled={isUploading}
              />
              <Label htmlFor={`hub-${hub.value}`} className="cursor-pointer">
                {hub.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Processing document...</Label>
            <span className="text-sm text-muted-foreground">{Math.round(processingProgress)}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
          {processingProgress >= 30 && (
            <p className="text-xs text-muted-foreground">
              {processingProgress < 90 
                ? "Creating chunks and generating embeddings..." 
                : "Finalizing document processing..."}
            </p>
          )}
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={isUploading || !title || (uploadMethod === 'text' ? !content : !file) || selectedHubAreas.length === 0}
        className="w-full"
      >
        {isUploading ? "Processing..." : "Upload Document"}
      </Button>
    </div>
  )
}
