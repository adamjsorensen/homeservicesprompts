
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

  const categories = [
    {
      id: "marketing",
      title: "Marketing",
      description: "Generate content for your marketing campaigns",
      iconName: "TrendingUp"
    },
    {
      id: "sales",
      title: "Sales",
      description: "Create compelling sales copy and proposals",
      iconName: "ShoppingBag"
    },
    {
      id: "production",
      title: "Production",
      description: "Streamline your content production workflow",
      iconName: "Factory"
    },
    {
      id: "team",
      title: "Team",
      description: "Improve team communication and collaboration",
      iconName: "Users"
    },
    {
      id: "strategy",
      title: "Strategy & Planning",
      description: "Develop effective business strategies and plans",
      iconName: "Brain"
    },
    {
      id: "financials",
      title: "Financials",
      description: "Generate financial reports and analysis",
      iconName: "DollarSign"
    },
    {
      id: "leadership",
      title: "Personal Leadership",
      description: "Enhance your leadership and management skills",
      iconName: "User"
    }
  ];

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
              iconName={category.iconName}
              onClick={() => onCategorySelect?.(category.id)}
            />
          ))}
        </div>
      </div>
    );
  }

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
