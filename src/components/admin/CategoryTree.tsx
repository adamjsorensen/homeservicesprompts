
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
import { PromptItem } from "./PromptItem";
import { type Prompt } from "@/hooks/usePrompts";

interface CategoryTreeProps {
  categories: Prompt[];
  hubArea: string;
  onDragEnd: (event: DragEndEvent, parentId: string | null) => void;
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
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 50,
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

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const item = categories.find(c => c.id === id);
    if (item) {
      setCurrentParentId(item.parent_id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event, currentParentId);
    setCurrentParentId(null);
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
                <>
                  {/* Render subcategories */}
                  {renderCategories(category.id, level + 1)}
                  
                  {/* Render prompts */}
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
      {renderCategories()}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <div className="opacity-80">
            {categories.find(c => c.id === activeId)?.is_category ? (
              <CategoryItem
                id={activeId}
                title={categories.find(c => c.id === activeId)?.title || ''}
                level={0}
                isExpanded={false}
                promptCount={getPromptCount(activeId)}
                onDelete={() => {}}
                onToggle={() => {}}
              />
            ) : (
              <PromptItem
                id={activeId}
                title={categories.find(c => c.id === activeId)?.title || ''}
                description={categories.find(c => c.id === activeId)?.description || ''}
              />
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
