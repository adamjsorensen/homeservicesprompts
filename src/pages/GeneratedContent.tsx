
import { useEffect } from "react";
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
import { Copy, ArrowLeft, Undo } from "lucide-react";
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
      await navigator.clipboard.writeText(initialContent);
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
              Review your generated content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{initialContent}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleCopy}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
