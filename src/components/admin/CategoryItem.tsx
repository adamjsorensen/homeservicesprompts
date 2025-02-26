
import { ArrowUp, ArrowDown, ChevronRight, Trash2 } from "lucide-react";
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
  onMoveUp: () => Promise<void>;
  onMoveDown: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

export const CategoryItem = ({
  id,
  title,
  level,
  isExpanded,
  promptCount,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: CategoryItemProps) => {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border bg-card/50 text-card-foreground shadow-sm hover:shadow-md transition-all duration-200",
        level > 0 && "ml-6"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="p-1 hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
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

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={onMoveUp}
                  disabled={isFirst}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move category up</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={onMoveDown}
                  disabled={isLast}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move category down</TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
    </div>
  );
};
