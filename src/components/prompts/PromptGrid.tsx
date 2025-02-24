
import { useNavigate } from "react-router-dom";
import { CategoryTile } from "./CategoryTile";
import { PromptCard } from "./PromptCard";
import { type Prompt } from "@/hooks/usePrompts";
import { useToast } from "@/components/ui/use-toast";

interface PromptGridProps {
  items: Prompt[];
  isAdmin?: boolean;
  onCustomize?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
}

export function PromptGrid({
  items,
  isAdmin,
  onCustomize,
  onDelete,
}: PromptGridProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      toast({
        description: "Prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to copy prompt",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CategoryTile
        title="Chat Assistant"
        description="Chat with an AI assistant to help you generate content"
        iconName="MessageSquare"
        onClick={() => navigate("/chat")}
        className="bg-purple-50 border-purple-200 hover:bg-purple-100"
      />
      <div className="grid grid-cols-1 gap-6">
        {items.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            isAdmin={isAdmin}
            onCustomize={() => onCustomize?.(prompt)}
            onDelete={() => onDelete?.(prompt)}
            onCopy={() => handleCopy(prompt)}
          />
        ))}
      </div>
    </div>
  );
}
