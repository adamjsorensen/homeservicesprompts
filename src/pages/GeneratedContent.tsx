
import { useEffect, useState } from "react";
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
import { Layout } from "@/components/layout/Layout";
import { Copy, ArrowLeft, Edit2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface LocationState {
  generatedContent: string;
  promptTitle: string;
}

export function GeneratedContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { generatedContent: initialContent, promptTitle } = 
    (location.state as LocationState) || { generatedContent: "", promptTitle: "" };

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable: isEditing,
  });

  useEffect(() => {
    const saveGeneratedContent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        console.log("Saving generated content...");
        const { error } = await supabase.from("saved_generations").insert({
          content: initialContent,
          user_id: user.id,
          title: promptTitle,
        });

        if (error) throw error;

        console.log("Content saved successfully");
        toast({
          description: "Content saved automatically",
        });
      } catch (error) {
        console.error("Error saving content:", error);
        toast({
          variant: "destructive",
          description: "Failed to save content automatically",
        });
      }
    };

    if (initialContent && promptTitle) {
      saveGeneratedContent();
    }
  }, [initialContent, promptTitle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editor?.getHTML() || initialContent);
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
    if (!editor) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("saved_generations")
        .update({ content: editor.getHTML() })
        .eq('user_id', user.id)
        .eq('title', promptTitle);

      if (error) throw error;

      setIsEditing(false);
      toast({
        description: "Content saved successfully",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        description: "Failed to save content",
      });
    }
  };

  return (
    <Layout>
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
              <EditorContent editor={editor} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
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
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
