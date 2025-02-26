
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CategoryTree } from "@/components/admin/CategoryTree";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableHub } from "@/components/admin/SortableHub";
import { supabase } from "@/integrations/supabase/client";

type HubAreaType = "marketing" | "sales" | "production" | "team" | "strategy" | "financials" | "leadership";

const AdminHubs = () => {
  const { prompts } = usePrompts();
  const { toast } = useToast();
  const [deleteHubId, setDeleteHubId] = useState<HubAreaType | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [orderedHubs, setOrderedHubs] = useState<HubAreaType[]>([]);
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());

  if (orderedHubs.length === 0 && prompts.length > 0) {
    const hubAreas = [...new Set(prompts.map(prompt => prompt.hub_area))]
      .filter((area): area is HubAreaType => {
        const validAreas: HubAreaType[] = ["marketing", "sales", "production", "team", "strategy", "financials", "leadership"];
        return area !== null && validAreas.includes(area as HubAreaType);
      })
      .sort((a, b) => {
        const aOrder = prompts.find(p => p.hub_area === a)?.display_order || 0;
        const bOrder = prompts.find(p => p.hub_area === b)?.display_order || 0;
        return aOrder - bOrder;
      });
    setOrderedHubs(hubAreas);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log('[AdminHubs] Drag ended but no valid target:', { active, over });
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log('[AdminHubs] Drag ended:', {
      activeId,
      overId,
      active,
      over
    });

    // Check if we're dealing with a hub or a prompt/category
    const activeHub = orderedHubs.find(hub => hub === activeId);
    if (activeHub) {
      console.log('[AdminHubs] Reordering hub:', activeHub);
      // Handle hub reordering
      const oldIndex = orderedHubs.indexOf(activeId as HubAreaType);
      const newIndex = orderedHubs.indexOf(overId as HubAreaType);
      const newOrder = arrayMove(orderedHubs, oldIndex, newIndex);
      setOrderedHubs(newOrder);
      return;
    }

    // Handle prompt/category reordering
    const activeItem = prompts.find(p => p.id === activeId);
    const overItem = prompts.find(p => p.id === overId);
    
    if (!activeItem || !overItem) {
      console.error('[AdminHubs] Could not find active or over item:', { activeItem, overItem });
      return;
    }

    // Get the parent element's data-parent-id attribute
    const parentElement = document.querySelector(`[data-id="${activeId}"]`)?.closest('[data-parent-id]');
    const parentId = parentElement?.getAttribute('data-parent-id') || null;

    console.log('[AdminHubs] Found parent element:', {
      parentElement,
      parentId,
      activeElement: document.querySelector(`[data-id="${activeId}"]`),
      closestParent: document.querySelector(`[data-id="${activeId}"]`)?.closest('[data-parent-id]')
    });

    try {
      console.log('[AdminHubs] Reordering items:', {
        activeId,
        overId,
        parentId,
        activeItem,
        overItem
      });

      const itemsAtLevel = prompts
        .filter(p => p.parent_id === parentId)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
      console.log('[AdminHubs] Items at level:', itemsAtLevel);

      const oldIndex = itemsAtLevel.findIndex(item => item.id === activeId);
      const newIndex = itemsAtLevel.findIndex(item => item.id === overId);
      
      console.log('[AdminHubs] Indexes:', { oldIndex, newIndex });

      let newOrder: number;
      if (newIndex === 0) {
        newOrder = (itemsAtLevel[0].display_order || 0) - 1;
      } else if (newIndex === itemsAtLevel.length - 1) {
        newOrder = (itemsAtLevel[itemsAtLevel.length - 1].display_order || 0) + 1;
      } else {
        const prevOrder = itemsAtLevel[newIndex - 1].display_order || 0;
        const nextOrder = itemsAtLevel[newIndex].display_order || 0;
        newOrder = (prevOrder + nextOrder) / 2;
      }

      console.log('[AdminHubs] Updating order:', {
        itemId: activeId,
        newOrder,
        oldIndex,
        newIndex
      });

      const { error } = await supabase
        .from('prompts')
        .update({ display_order: newOrder })
        .eq('id', activeId);

      if (error) {
        console.error('[AdminHubs] Error updating order:', error);
        throw error;
      }

      console.log('[AdminHubs] Successfully updated order');

      toast({
        title: "Success",
        description: "Item order updated successfully",
      });
    } catch (error) {
      console.error('[AdminHubs] Error updating order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item order",
      });
    }
  };

  const handleDeleteHub = async () => {
    if (!deleteHubId) return;

    try {
      toast({
        title: "Success",
        description: "Hub deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete hub",
      });
    } finally {
      setDeleteHubId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeleteCategoryId(categoryId);
  };

  const formatHubTitle = (hubArea: string) => {
    return hubArea.charAt(0).toUpperCase() + hubArea.slice(1) + " Hub";
  };

  const toggleHub = (hubId: string) => {
    const newExpanded = new Set(expandedHubs);
    if (newExpanded.has(hubId)) {
      newExpanded.delete(hubId);
    } else {
      newExpanded.add(hubId);
    }
    setExpandedHubs(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hub Management</h1>
          <p className="text-muted-foreground">
            Organize and manage your prompt hubs
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="bg-[#9b87f5] hover:bg-[#8b77e5]">
                <Plus className="w-4 h-4 mr-2" />
                Add Hub
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new hub for organizing prompts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedHubs}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {orderedHubs.map((hubArea) => {
              const promptCount = prompts.filter(p => p.hub_area === hubArea).length;
              const isExpanded = expandedHubs.has(hubArea);
              return (
                <div key={hubArea} className="space-y-2">
                  <SortableHub
                    id={hubArea}
                    title={formatHubTitle(hubArea)}
                    promptCount={promptCount}
                    onDelete={() => setDeleteHubId(hubArea)}
                    isExpanded={isExpanded}
                    onToggle={() => toggleHub(hubArea)}
                  />
                  {isExpanded && (
                    <div className="ml-8">
                      <CategoryTree
                        categories={prompts.filter(p => p.hub_area === hubArea)}
                        hubArea={hubArea}
                        onDeleteCategory={handleDeleteCategory}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={!!deleteHubId} onOpenChange={() => setDeleteHubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hub</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this hub? All categories will be deleted, but prompts will be preserved and can be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Hub
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? All prompts will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDeleteCategoryId(null)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHubs;
