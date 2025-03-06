
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingCard } from "@/components/prompts/LoadingCard";
import { Share2, Copy, Pencil, Check } from "lucide-react";

interface LocationState {
  generatedContent: string;
  promptTitle: string;
}

const GeneratedContent = () => {
  const { state } = useLocation();
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [modifiedContent, setModifiedContent] = useState<string>("");
  const [modification, setModification] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle direct navigation without state
    if (!state) {
      navigate("/library");
      return;
    }

    const { generatedContent, promptTitle } = state as LocationState;
    
    if (generatedContent) {
      setContent(generatedContent);
      setModifiedContent(generatedContent);
      setTitle(promptTitle || "Generated Content");
      setIsLoading(false);
    } else {
      navigate("/library");
    }
  }, [state, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(modifiedContent || content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to save content.",
        });
        return;
      }

      const { error } = await supabase
        .from("saved_generations")
        .insert({
          title: title,
          content: modifiedContent || content,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Content saved",
        description: "Your content has been saved successfully.",
      });
      
      navigate("/saved-generations");
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save content. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModifyContent = async () => {
    if (!modification.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a modification instruction."
      });
      return;
    }

    setIsModifying(true);
    try {
      // Get the Supabase functions URL
      const functionsUrl = supabase.functions.url;
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';
      
      console.log('Invoking modify-content edge function', { 
        modificationLength: modification.length,
        contentLength: content.length,
        hasAccessToken: !!accessToken
      });

      // Direct fetch with proper authentication
      const response = await fetch(`${functionsUrl}/modify-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content, modification })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response from modify-content:', { 
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Received response:', { success: !!data.modifiedContent });
      
      if (data.modifiedContent) {
        setModifiedContent(data.modifiedContent);
        toast({
          title: "Content modified",
          description: "The content has been modified according to your instructions."
        });
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (error) {
      console.error("Error modifying content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to modify content: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsModifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none dark:prose-invert whitespace-pre-wrap">
            {modifiedContent || content}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Modify Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter instructions for modifying the content (e.g., 'Make it more formal' or 'Add bullet points')"
            value={modification}
            onChange={(e) => setModification(e.target.value)}
            className="min-h-[100px]"
            disabled={isModifying}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleModifyContent} disabled={isModifying || !modification.trim()}>
            {isModifying ? "Modifying..." : "Apply Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GeneratedContent;
