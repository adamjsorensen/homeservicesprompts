import { type Prompt } from "@/hooks/usePrompts";
import { useState } from "react";
import { CategoryItem } from "./CategoryItem";
import { PromptItem } from "./PromptItem";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CategoryTreeProps {
  categories: Prompt[];
  hubArea: string;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryTree = ({
  categories,
  hubArea,
  onDeleteCategory,
}: CategoryTreeProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleCategory = (categoryId: string) => {
    console.log('[CategoryTree] Toggling category:', categoryId);
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getRootCategory = () => {
    const root = categories.find(
      category => 
        category.is_category && 
        category.parent_id === null &&
        category.hub_area === hubArea
    );
    console.log('[CategoryTree] Found root category:', root);
    return root;
  };

  const getSubcategories = (parentId: string | null): Prompt[] => {
    const rootCategory = getRootCategory();
    const effectiveParentId = parentId === null ? rootCategory?.id : parentId;
    console.log('[CategoryTree] Getting subcategories for parent:', effectiveParentId);

    const subcategories = categories.filter(
      (category) => 
        category.is_category && 
        category.parent_id === effectiveParentId &&
        category.id !== rootCategory?.id
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    console.log('[CategoryTree] Found subcategories:', subcategories);
    return subcategories;
  };

  const getPrompts = (categoryId: string): Prompt[] => {
    console.log('[CategoryTree] Getting prompts for category:', categoryId);
    const prompts = categories.filter(
      (prompt) => !prompt.is_category && prompt.parent_id === categoryId
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    console.log('[CategoryTree] Found prompts:', prompts);
    return prompts;
  };

  const getPromptCount = (categoryId: string): number => {
    const directPrompts = getPrompts(categoryId).length;
    const subcategoryPrompts = getSubcategories(categoryId).reduce(
      (count, subcategory) => count + getPromptCount(subcategory.id),
      0
    );
    const total = directPrompts + subcategoryPrompts;
    console.log('[CategoryTree] Prompt count for category:', categoryId, 'Total:', total);
    return total;
  };

  const moveItem = async (itemId: string, direction: 'up' | 'down', parentId: string | null) => {
    console.log('[CategoryTree] Moving item:', { itemId, direction, parentId });
    
    const items = getSubcategories(parentId);
    const currentIndex = items.findIndex(item => item.id === itemId);
    
    if (currentIndex === -1) {
      console.error('[CategoryTree] Item not found:', itemId);
      return;
    }

    let newOrder: number;
    if (direction === 'up' && currentIndex > 0) {
      const prevItem = items[currentIndex - 1];
      newOrder = prevItem.display_order! - 1;
    } else if (direction === 'down' && currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      newOrder = nextItem.display_order! + 1;
    } else {
      console.log('[CategoryTree] Cannot move item', direction);
      return;
    }

    try {
      console.log('[CategoryTree] Updating order:', { itemId, newOrder });
      const { error } = await supabase
        .from('prompts')
        .update({ display_order: newOrder })
        .eq('id', itemId);

      if (error) {
        console.error('[CategoryTree] Error updating order:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Item moved ${direction} successfully`,
      });
    } catch (error) {
      console.error('[CategoryTree] Error moving item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to move item ${direction}`,
      });
    }
  };

  const movePrompt = async (promptId: string, direction: 'up' | 'down', categoryId: string) => {
    console.log('[CategoryTree] Moving prompt:', { promptId, direction, categoryId });
    
    const prompts = getPrompts(categoryId);
    const currentIndex = prompts.findIndex(prompt => prompt.id === promptId);
    
    if (currentIndex === -1) {
      console.error('[CategoryTree] Prompt not found:', promptId);
      return;
    }

    let newOrder: number;
    if (direction === 'up' && currentIndex > 0) {
      const prevPrompt = prompts[currentIndex - 1];
      newOrder = prevPrompt.display_order! - 1;
    } else if (direction === 'down' && currentIndex < prompts.length - 1) {
      const nextPrompt = prompts[currentIndex + 1];
      newOrder = nextPrompt.display_order! + 1;
    } else {
      console.log('[CategoryTree] Cannot move prompt', direction);
      return;
    }

    try {
      console.log('[CategoryTree] Updating prompt order:', { promptId, newOrder });
      const { error } = await supabase
        .from('prompts')
        .update({ display_order: newOrder })
        .eq('id', promptId);

      if (error) {
        console.error('[CategoryTree] Error updating prompt order:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Prompt moved ${direction} successfully`,
      });
    } catch (error) {
      console.error('[CategoryTree] Error moving prompt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to move prompt ${direction}`,
      });
    }
  };

  const renderCategories = (parentId: string | null = null, level: number = 0) => {
    console.log('[CategoryTree] Rendering categories for parent:', parentId, 'Level:', level);
    const categoryItems = getSubcategories(parentId);
    const rootCategory = getRootCategory();
    const effectiveParentId = parentId === null ? rootCategory?.id : parentId;
    
    if (categoryItems.length === 0 && !effectiveParentId) {
      console.log('[CategoryTree] No categories to render for parent:', parentId);
      return null;
    }

    return (
      <div className="space-y-2 animate-fade-in">
        {categoryItems.map((category, index) => {
          console.log('[CategoryTree] Rendering category item:', category.id, category.title);
          return (
            <div key={category.id} data-parent-id={effectiveParentId}>
              <CategoryItem
                id={category.id}
                title={category.title}
                level={level}
                isExpanded={expandedCategories.has(category.id)}
                promptCount={getPromptCount(category.id)}
                onDelete={() => onDeleteCategory(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onMoveUp={() => moveItem(category.id, 'up', effectiveParentId)}
                onMoveDown={() => moveItem(category.id, 'down', effectiveParentId)}
                isFirst={index === 0}
                isLast={index === categoryItems.length - 1}
              />
              {expandedCategories.has(category.id) && (
                <>
                  {renderCategories(category.id, level + 1)}
                  <div className="ml-6 space-y-2">
                    {getPrompts(category.id).map((prompt, promptIndex) => {
                      const prompts = getPrompts(category.id);
                      return (
                        <PromptItem
                          key={prompt.id}
                          id={prompt.id}
                          title={prompt.title}
                          description={prompt.description || ""}
                          onMoveUp={() => movePrompt(prompt.id, 'up', category.id)}
                          onMoveDown={() => movePrompt(prompt.id, 'down', category.id)}
                          isFirst={promptIndex === 0}
                          isLast={promptIndex === prompts.length - 1}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderCategories()}
    </div>
  );
};
