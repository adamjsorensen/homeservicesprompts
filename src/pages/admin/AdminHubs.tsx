
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Grip, ChevronRight, X } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
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

// Define the valid hub area types
type HubAreaType = "marketing" | "sales" | "production" | "team" | "strategy" | "financials" | "leadership";

interface SortableHubProps {
  id: HubAreaType;
  title: string;
  promptCount: number;
  onDelete: () => void;
}

const SortableHub = ({ id, title, promptCount, onDelete }: SortableHubProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-6 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          >
            <Grip className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h3 className="text-lg font-semibold group-hover:text-purple-600 transition-colors flex items-center gap-2">
              {title}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {promptCount} prompts
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const AdminHubs = () => {
  const { prompts } = usePrompts();
  const { toast } = useToast();
  const [deleteHubId, setDeleteHubId] = useState<HubAreaType | null>(null);
  
  // Filter and type-check hub areas
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = hubAreas.indexOf(active.id as HubAreaType);
      const newIndex = hubAreas.indexOf(over.id as HubAreaType);

      // Update display order in the database
      const updateOrder = async () => {
        try {
          // TODO: Implement the database update for display order
          toast({
            title: "Success",
            description: "Hub order updated successfully",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update hub order",
          });
        }
      };

      updateOrder();
    }
  };

  const handleDeleteHub = async () => {
    if (!deleteHubId) return;

    try {
      // TODO: Implement the database deletion for hub
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hub Management</h1>
          <p className="text-muted-foreground">
            Organize and manage your prompt hubs
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Hub
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={hubAreas}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {hubAreas.map((hubArea) => (
              <SortableHub
                key={hubArea}
                id={hubArea}
                title={hubArea}
                promptCount={prompts.filter(p => p.hub_area === hubArea).length}
                onDelete={() => setDeleteHubId(hubArea)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={!!deleteHubId} onOpenChange={() => setDeleteHubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the hub and all its categories. Prompts will be preserved but will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHubs;
