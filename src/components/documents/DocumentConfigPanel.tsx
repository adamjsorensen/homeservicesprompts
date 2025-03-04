
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Document {
  id: string;
  title: string;
  hub_areas: string[];
  file_type: string;
  metadata: Record<string, any>;
}

interface DocumentConfigPanelProps {
  document: Document;
  onUpdate: () => void;
}

export function DocumentConfigPanel({ document, onUpdate }: DocumentConfigPanelProps) {
  const { toast } = useToast()
  
  // Document priority (from metadata or default)
  const [priority, setPriority] = useState<string>(
    document.metadata?.priority || 'medium'
  )
  
  // Document weight (from metadata or default to 0.5)
  const [weight, setWeight] = useState<number>(
    document.metadata?.weight !== undefined ? document.metadata.weight : 0.5
  )
  
  // Document active status (from metadata or default to true)
  const [isActive, setIsActive] = useState<boolean>(
    document.metadata?.active !== false // Default to true unless explicitly set to false
  )
  
  // Quality threshold (from metadata or default to 0.6)
  const [qualityThreshold, setQualityThreshold] = useState<number>(
    document.metadata?.quality_threshold || 0.6
  )
  
  // Access level (from metadata or default to 'all')
  const [accessLevel, setAccessLevel] = useState<string>(
    document.metadata?.access_level || 'all'
  )

  // Save document configuration
  const handleSave = async () => {
    try {
      // Update document with new metadata
      const { error } = await supabase
        .from('documents')
        .update({
          metadata: {
            ...document.metadata,
            priority,
            weight,
            active: isActive,
            quality_threshold: qualityThreshold,
            access_level: accessLevel,
            updated_at: new Date().toISOString(),
          }
        })
        .eq('id', document.id)
      
      if (error) throw error
      
      toast({
        title: "Document updated",
        description: "Document settings have been saved successfully."
      })
      
      // Refresh the parent component
      onUpdate()
    } catch (error) {
      console.error('Error updating document:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document settings. Please try again."
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Document Configuration</CardTitle>
        <CardDescription>
          Configure how this document is used in context retrieval
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="priority">Priority Level</Label>
            <Badge variant={
              priority === 'high' ? 'default' : 
              priority === 'medium' ? 'secondary' : 
              'outline'
            }>
              {priority}
            </Badge>
          </div>
          <Select 
            value={priority} 
            onValueChange={setPriority}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="weight">Document Weight: {weight.toFixed(2)}</Label>
          </div>
          <Slider 
            id="weight"
            min={0} 
            max={1} 
            step={0.05} 
            value={[weight]}
            onValueChange={(vals) => setWeight(vals[0])}
          />
          <p className="text-xs text-muted-foreground">
            Higher weight increases document prominence in context retrieval
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="quality">Quality Threshold: {qualityThreshold.toFixed(2)}</Label>
          </div>
          <Slider 
            id="quality"
            min={0.1} 
            max={0.9} 
            step={0.05} 
            value={[qualityThreshold]}
            onValueChange={(vals) => setQualityThreshold(vals[0])}
          />
          <p className="text-xs text-muted-foreground">
            Minimum similarity score required for chunks to be included
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="access">Access Level</Label>
          <Select 
            value={accessLevel} 
            onValueChange={setAccessLevel}
          >
            <SelectTrigger id="access">
              <SelectValue placeholder="Select Access Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="authenticated">Authenticated Only</SelectItem>
              <SelectItem value="admin">Admin Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="active" className="cursor-pointer">
            Document Active
          </Label>
          <Switch 
            id="active" 
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  )
}
