
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SortableHubProps {
  id: string;
  title: string;
  promptCount: number;
  onDelete: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const SortableHub = ({ 
  id, 
  title, 
  promptCount, 
  onDelete,
  isExpanded = true,
  onToggle = () => {},
}: SortableHubProps) => {
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
        "p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  {...attributes}
                  {...listeners}
                  className="p-1 hover:bg-accent rounded cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <Grip className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Drag to reorder hub</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <ChevronRight 
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete hub</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
