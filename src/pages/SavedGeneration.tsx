
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

export function SavedGeneration() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { data: generation, isLoading } = useQuery({
    queryKey: ["saved-generation", slug],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("saved_generations")
        .select()
        .eq("slug", slug)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: generation?.content || "",
    editable: isEditing,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editor?.getHTML() || generation?.content || "");
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
    if (!editor || !generation) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("saved_generations")
        .update({ content: editor.getHTML() })
        .eq('user_id', user.id)
        .eq('slug', slug);

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!generation) {
    return <div>Generation not found</div>;
  }

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
            <CardTitle>{generation.title}</CardTitle>
            <CardDescription>
              Review and edit your saved content
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
