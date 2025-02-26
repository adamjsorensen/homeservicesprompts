
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CategoryItem } from "./CategoryItem";
import { type Prompt } from "@/hooks/usePrompts";

interface CategoryTreeProps {
  categories: Prompt[];
  hubArea: string;
  onDragEnd: (event: DragEndEvent) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryTree = ({
  categories,
  hubArea,
  onDragEnd,
  onDeleteCategory,
}: CategoryTreeProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // First, find the root category for this hub
  const getRootCategory = () => {
    return categories.find(
      category => 
        category.is_category && 
        category.parent_id === null &&
        category.hub_area === hubArea
    );
  };

  const getSubcategories = (parentId: string | null): Prompt[] => {
    // If we're looking for root-level categories, use the hub's root category ID
    const rootCategory = getRootCategory();
    const effectiveParentId = parentId === null ? rootCategory?.id : parentId;

    return categories.filter(
      (category) => 
        category.is_category && 
        category.parent_id === effectiveParentId &&
        // Don't include the root category itself in the list
        category.id !== rootCategory?.id
    );
  };

  const getPromptCount = (categoryId: string): number => {
    const directPrompts = categories.filter(
      (prompt) => !prompt.is_category && prompt.parent_id === categoryId
    ).length;

    const subcategoryPrompts = getSubcategories(categoryId).reduce(
      (count, subcategory) => count + getPromptCount(subcategory.id),
      0
    );

    return directPrompts + subcategoryPrompts;
  };

  const renderCategories = (parentId: string | null = null, level: number = 0) => {
    const categoryItems = getSubcategories(parentId);
    
    console.log('Rendering categories:', {
      parentId,
      level,
      itemCount: categoryItems.length,
      categoryItems: categoryItems.map(c => ({ id: c.id, title: c.title }))
    });

    if (categoryItems.length === 0) return null;

    return (
      <div className="space-y-2 animate-fade-in">
        {categoryItems.map((category) => (
          <div key={category.id}>
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
              renderCategories(category.id, level + 1)
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={categories.filter(c => c.is_category).map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {renderCategories()}
      </SortableContext>
    </DndContext>
  );
};
