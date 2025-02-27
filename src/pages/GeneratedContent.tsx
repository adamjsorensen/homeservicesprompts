import { useState, useEffect, useRef } from "react";
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
import { Copy, ArrowLeft, Edit2, Save, Undo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContentEditor } from "@/components/editor/ContentEditor";
import { QuickActions } from "@/components/editor/QuickActions";
import { ChatInput } from "@/components/editor/ChatInput";
import { useSaveContent } from "@/hooks/useSaveContent";

interface LocationState {
  generatedContent: string;
  promptTitle: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function GeneratedContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  
  const { generatedContent: initialContent, promptTitle } = 
    (location.state as LocationState) || { generatedContent: "", promptTitle: "" };
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [contentHistory, setContentHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
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
  }, [initialContent, promptTitle, saveGeneratedContent]);

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

  const addToHistory = (newContent: string) => {
    if (historyIndex < contentHistory.length - 1) {
      setContentHistory(prev => [...prev.slice(0, historyIndex + 1), newContent]);
    } else {
      setContentHistory(prev => [...prev, newContent]);
    }
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCurrentContent(contentHistory[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < contentHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentContent(contentHistory[nextIndex]);
    }
  };

  const addChatMessage = (content: string, isUser: boolean) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const parseModification = (modification: string) => {
    const lowerMod = modification.toLowerCase();
    
    if (lowerMod.includes('short') || lowerMod.includes('brief') || lowerMod.includes('concise')) {
      return 'Make this content shorter and more concise without losing the key points.';
    } else if (lowerMod.includes('long') || lowerMod.includes('detail') || lowerMod.includes('elaborate')) {
      return 'Expand this content with more details and examples.';
    } else if (lowerMod.includes('formal') || lowerMod.includes('professional')) {
      return 'Make this content more formal and professional in tone.';
    } else if (lowerMod.includes('casual') || lowerMod.includes('friendly') || lowerMod.includes('conversational')) {
      return 'Make this content more casual and conversational.';
    } else if (lowerMod.includes('bullet') || lowerMod.includes('list')) {
      return 'Format this content with bullet points for key items.';
    } else if (lowerMod.includes('persuasive') || lowerMod.includes('convince')) {
      return 'Make this content more persuasive and compelling.';
    }
    
    return modification;
  };

  const handleModifyContent = async (modification: string) => {
    setIsModifying(true);
    
    addChatMessage(modification, true);
    
    const parsedModification = parseModification(modification);
    
    try {
      const { data, error } = await supabase.functions.invoke('modify-content', {
        body: {
          content: currentContent,
          modification: parsedModification
        }
      });

      if (error) throw error;

      if (data.modifiedContent) {
        addChatMessage(`Content updated as requested.`, false);
        
        setCurrentContent(data.modifiedContent);
        addToHistory(data.modifiedContent);
        
        toast({
          description: "Content updated successfully",
        });
      }
    } catch (error) {
      console.error('Error modifying content:', error);
      
      addChatMessage(`Sorry, I couldn't modify the content: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
      
      toast({
        variant: "destructive",
        description: "Failed to modify content",
      });
    } finally {
      setIsModifying(false);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < contentHistory.length - 1;

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
            <div className="flex justify-between gap-2">
              <div>
                {contentHistory.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="mr-2"
                  >
                    <Undo className="mr-2 h-4 w-4" />
                    Undo
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
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
