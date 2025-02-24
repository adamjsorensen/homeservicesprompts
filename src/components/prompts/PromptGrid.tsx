
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
  currentCategory?: string | null;
  onCategorySelect?: (categoryId: string) => void;
}

export function PromptGrid({
  items,
  isAdmin,
  onCustomize,
  onDelete,
  currentCategory,
  onCategorySelect,
}: PromptGridProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = items.filter(item => item.is_category);
  const prompts = items.filter(item => !item.is_category);

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

  if (!currentCategory) {
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
          {categories.map((category) => (
            <CategoryTile
              key={category.id}
              title={category.title}
              description={category.description}
              iconName={getCategoryIcon(category.title)}
              onClick={() => onCategorySelect?.(category.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map((prompt) => (
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

// Helper function to map category titles to appropriate icons
function getCategoryIcon(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('blog')) return 'PenTool';
  if (titleLower.includes('social')) return 'Share2';
  if (titleLower.includes('email')) return 'Mail';
  if (titleLower.includes('marketing')) return 'TrendingUp';
  if (titleLower.includes('seo')) return 'Search';
  if (titleLower.includes('ad')) return 'Target';
  if (titleLower.includes('content')) return 'FileText';
  if (titleLower.includes('video')) return 'Video';
  if (titleLower.includes('script')) return 'FileCode';
  return 'Folder';
}
