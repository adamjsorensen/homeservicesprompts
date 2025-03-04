
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Document } from "@/types/documentTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useGraphlitOperations } from "@/hooks/useGraphlitOperations"; 
import { GraphlitDocumentInfo } from "./GraphlitDocumentInfo";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const HUB_AREAS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'production', label: 'Production' },
  { value: 'team', label: 'Team' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'financials', label: 'Financials' },
  { value: 'leadership', label: 'Leadership' },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  hub_areas: z.array(z.string()).min(1, "Select at least one hub area"),
  metadata: z.record(z.any()).optional(),
});

interface DocumentConfigPanelProps {
  document: Document;
  onUpdate: () => void;
}

export function DocumentConfigPanel({ document, onUpdate }: DocumentConfigPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { deleteDocument } = useGraphlitOperations();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document.title || "",
      hub_areas: document.hub_areas || [],
      metadata: document.metadata || {},
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: values.title,
          hub_areas: values.hub_areas,
          metadata: {
            ...document.metadata,
            ...values.metadata,
            last_edited: new Date().toISOString(),
          },
        })
        .eq('id', document.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
      
      onUpdate();
    } catch (err) {
      console.error('Error updating document:', err);
      setError("Failed to update document. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteDocument.mutateAsync(document.id, document.graphlit_doc_id);
      
      toast({
        title: "Document Deleted",
        description: "The document has been permanently deleted",
      });
      
      onUpdate();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError("Failed to delete document. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hub_areas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hub Areas</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const currentAreas = field.value || [];
                        const newAreas = currentAreas.includes(value)
                          ? currentAreas.filter(area => area !== value)
                          : [...currentAreas, value];
                        field.onChange(newAreas);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hub areas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HUB_AREAS.map((hub) => (
                          <SelectItem
                            key={hub.value}
                            value={hub.value}
                            className={field.value?.includes(hub.value) ? "bg-primary/10" : ""}
                          >
                            {hub.label} {field.value?.includes(hub.value) && "✓"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selected: {field.value?.map(area => 
                        HUB_AREAS.find(hub => hub.value === area)?.label
                      ).join(", ") || "None"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete Document"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the document and all associated chunks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="space-y-6">
          <GraphlitDocumentInfo 
            document={document} 
            onUpdate={onUpdate}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Document Statistics</CardTitle>
              <CardDescription>
                Document usage and performance information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">File Type</h4>
                <p className="text-sm">{document.file_type?.toUpperCase()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Created At</h4>
                <p className="text-sm">
                  {new Date(document.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Last Updated</h4>
                <p className="text-sm">
                  {new Date(document.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
