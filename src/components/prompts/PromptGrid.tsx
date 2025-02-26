
import { useNavigate } from "react-router-dom";
import { CategoryTile } from "./CategoryTile";
import { PromptCard } from "./PromptCard";
import { type Prompt, type CategoryWithPrompts } from "@/hooks/usePrompts";
import { useToast } from "@/components/ui/use-toast";

interface PromptGridProps {
  items: Prompt[];
  categorizedPrompts?: CategoryWithPrompts[];
  isAdmin?: boolean;
  onCustomize?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  currentCategory?: string | null;
  onCategorySelect?: (categoryId: string) => void;
}

export function PromptGrid({
  items,
  categorizedPrompts = [],
  isAdmin,
  onCustomize,
  onDelete,
  currentCategory,
  onCategorySelect,
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

  // If we're at the root level (no hub selected)
  if (!currentCategory && categorizedPrompts.length === 0) {
    return (
      <div className="space-y-6">
        <CategoryTile
          title="Chat Assistant"
          description="Get interactive help with content generation through our AI chat interface"
          iconName="MessageSquare"
          onClick={() => navigate("/chat")}
          className="bg-purple-50 border-purple-200 hover:bg-purple-100"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {["marketing", "sales", "production", "team", "strategy", "financials", "leadership"].map((hubArea) => (
            <CategoryTile
              key={hubArea}
              title={hubArea.charAt(0).toUpperCase() + hubArea.slice(1)}
              description={`Explore ${hubArea} related prompts`}
              iconName="Building"
              onClick={() => navigate(`/library/${hubArea}`)}
            />
          ))}
        </div>
      </div>
    );
  }

  // If we have categorized prompts and no current category (hub view)
  if (categorizedPrompts.length > 0 && !currentCategory) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorizedPrompts.map(({ category }) => (
            <CategoryTile
              key={category.id}
              title={category.title}
              description={category.description || ""}
              iconName={category.icon_name || "Folder"}
              onClick={() => onCategorySelect?.(category.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // If we're in a category, show its prompts
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.filter(item => !item.is_category).map((prompt) => (
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
  );
}
