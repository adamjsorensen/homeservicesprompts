
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PromptItemProps {
  id: string;
  title: string;
  description: string;
}

export const PromptItem = ({ id, title, description }: PromptItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    transition: {
      duration: 200,
      easing: 'ease',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-lg border bg-card/50 text-card-foreground shadow-sm hover:shadow-md transition-all duration-200",
        isDragging && "opacity-50 shadow-lg scale-105"
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
            <TooltipContent>Drag to reorder prompt</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
