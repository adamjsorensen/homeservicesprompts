
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

interface CategoryItemProps {
  id: string;
  title: string;
  level: number;
  isExpanded: boolean;
  promptCount: number;
  onDelete: () => void;
  onToggle: () => void;
}

export const CategoryItem = ({
  id,
  title,
  level,
  isExpanded,
  promptCount,
  onDelete,
  onToggle,
}: CategoryItemProps) => {
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
        "p-3 rounded-lg border bg-card/50 text-card-foreground shadow-sm hover:shadow-md transition-all",
        isDragging && "opacity-50 shadow-lg",
        level > 0 && "ml-6"
      )}
    >
      <div className="flex items-center gap-2">
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
            <TooltipContent>Drag to reorder category</TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

        <div className="flex items-center gap-2 flex-1">
          <h4 className="text-sm font-medium">{title}</h4>
          <span className="text-xs text-muted-foreground">
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
            <TooltipContent>Delete category</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
