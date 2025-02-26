
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Grip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Prompt } from "@/hooks/usePrompts";

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
        "p-4 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow",
        isDragging && "opacity-50",
        level > 0 && "ml-6"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          >
            <Grip className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-accent rounded"
          >
            <ChevronRight
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>
          <div>
            <h4 className="text-sm font-medium">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground">
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
