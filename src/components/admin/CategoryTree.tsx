
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
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getRootCategory = () => {
    return categories.find(
      category => 
        category.is_category && 
        category.parent_id === null &&
        category.hub_area === hubArea
    );
  };

  const getSubcategories = (parentId: string | null): Prompt[] => {
    const rootCategory = getRootCategory();
    const effectiveParentId = parentId === null ? rootCategory?.id : parentId;

    return categories.filter(
      (category) => 
        category.is_category && 
        category.parent_id === effectiveParentId &&
        category.id !== rootCategory?.id
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  const getPrompts = (categoryId: string): Prompt[] => {
    return categories.filter(
      (prompt) => !prompt.is_category && prompt.parent_id === categoryId
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  const getPromptCount = (categoryId: string): number => {
    const directPrompts = getPrompts(categoryId).length;
    const subcategoryPrompts = getSubcategories(categoryId).reduce(
      (count, subcategory) => count + getPromptCount(subcategory.id),
      0
    );
    return directPrompts + subcategoryPrompts;
  };

  const renderCategories = (parentId: string | null = null, level: number = 0) => {
    const categoryItems = getSubcategories(parentId);
    const rootCategory = getRootCategory();
    const effectiveParentId = parentId === null ? rootCategory?.id : parentId;
    
    if (categoryItems.length === 0 && !effectiveParentId) return null;

    return (
      <div className="space-y-2 animate-fade-in">
        <SortableContext
          items={categoryItems.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {categoryItems.map((category) => (
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
                      {getPrompts(category.id).map((prompt) => (
                        <PromptItem
                          key={prompt.id}
                          id={prompt.id}
                          title={prompt.title}
                          description={prompt.description || ""}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </>
              )}
            </div>
          ))}
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
