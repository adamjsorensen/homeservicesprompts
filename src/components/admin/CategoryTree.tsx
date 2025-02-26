
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CategoryItem } from "./CategoryItem";
import { PromptItem } from "./PromptItem";
import { type Prompt } from "@/hooks/usePrompts";
import { useState } from "react";

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
        <SortableContext
          items={categoryItems.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {categoryItems.map((category) => {
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
                />
                {expandedCategories.has(category.id) && (
                  <>
                    {renderCategories(category.id, level + 1)}
                    
                    <SortableContext
                      items={getPrompts(category.id).map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="ml-6 space-y-2">
                        {getPrompts(category.id).map((prompt) => {
                          console.log('[CategoryTree] Rendering prompt item:', prompt.id, prompt.title);
                          return (
                            <PromptItem
                              key={prompt.id}
                              id={prompt.id}
                              title={prompt.title}
                              description={prompt.description || ""}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </>
                )}
              </div>
            );
          })}
        </SortableContext>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderCategories()}
    </div>
  );
};
