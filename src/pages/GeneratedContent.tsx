
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Copy, ArrowLeft, Edit2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContentEditor } from "@/components/editor/ContentEditor";
import { QuickActions } from "@/components/editor/QuickActions";
import { ChatInput } from "@/components/editor/ChatInput";
import { useSaveContent } from "@/hooks/useSaveContent";

interface LocationState {
  generatedContent: string;
  promptTitle: string;
}

export function GeneratedContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const { generatedContent: initialContent, promptTitle } = 
    (location.state as LocationState) || { generatedContent: "", promptTitle: "" };
  const [currentContent, setCurrentContent] = useState(initialContent);
  
  const { saveGeneratedContent, updateContent } = useSaveContent();

  useEffect(() => {
    const autoSave = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (initialContent && promptTitle) {
        await saveGeneratedContent(initialContent, user.id, promptTitle);
      }
    };

    autoSave();
  }, [initialContent, promptTitle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      toast({
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to copy content",
      });
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const editorContent = document.querySelector('.ProseMirror')?.innerHTML;
    if (!editorContent) {
      toast({
        variant: "destructive",
        description: "Could not get editor content",
      });
      return;
    }

    const success = await updateContent(editorContent, user.id, promptTitle);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleModifyContent = async (modification: string) => {
    setIsModifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('modify-content', {
        body: {
          content: currentContent,
          modification
        }
      });

      if (error) throw error;

      if (data.modifiedContent) {
        setCurrentContent(data.modifiedContent);
        toast({
          description: "Content updated successfully",
        });
      }
    } catch (error) {
      console.error('Error modifying content:', error);
      toast({
        variant: "destructive",
        description: "Failed to modify content",
      });
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Generated Content: {promptTitle}</CardTitle>
          <CardDescription>
            Review and edit your generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`prose max-w-none ${isEditing ? 'border rounded-md p-4' : ''}`}>
            <ContentEditor
              content={currentContent}
              isEditing={isEditing}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full">
            <QuickActions 
              onActionClick={handleModifyContent}
              isLoading={isModifying}
            />
          </div>
          <div className="w-full flex flex-col gap-4">
            <ChatInput 
              onSubmit={handleModifyContent}
              isLoading={isModifying}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              {isEditing ? (
                <Button
                  variant="default"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
