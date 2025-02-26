
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimation,
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Only start dragging after moving 8px to prevent accidental drags
        distance: 8,
        // Add a small delay to prevent accidental drags
        delay: 50,
        // Tolerance for movement during the delay
        tolerance: 5,
      },
    }),
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const renderCategories = (parentId: string | null = null, level: number = 0) => {
    const categoryItems = getSubcategories(parentId);
    
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

  const dropAnimation = {
    ...defaultDropAnimation,
    dragSourceOpacity: 0.5,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.filter(c => c.is_category).map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {renderCategories()}
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <div className="opacity-80">
            <CategoryItem
              id={activeId}
              title={categories.find(c => c.id === activeId)?.title || ''}
              level={0}
              isExpanded={false}
              promptCount={getPromptCount(activeId)}
              onDelete={() => {}}
              onToggle={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
