
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Copy, ArrowLeft, Save, Undo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LocationState {
  generatedContent: string;
  promptTitle: string;
}

export function GeneratedContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { generatedContent: initialContent, promptTitle } = 
    (location.state as LocationState) || { generatedContent: "", promptTitle: "" };
  
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [originalContent] = useState(initialContent);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("saved_generations").insert({
        content: content,
        user_id: user.id,
        title: promptTitle,
      });

      if (error) throw error;

      toast({
        description: "Content saved successfully",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to save content",
      });
    }
  };

  const handleRevert = () => {
    setContent(originalContent);
    setIsEditing(false);
    toast({
      description: "Content reverted to original",
    });
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
              Review, edit, and save your generated content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            ) : (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{content}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Preview" : "Edit"}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleRevert}
                >
                  <Undo className="mr-2 h-4 w-4" />
                  Revert
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              {isEditing && (
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
