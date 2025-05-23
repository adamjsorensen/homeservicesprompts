
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Trash2, Building, Building2, Layers, Users, Target, LineChart, Brain, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SortableHubProps {
  id: string;
  title: string;
  promptCount: number;
  onDelete?: () => void;  // Made optional with ?
  isExpanded?: boolean;
  onToggle?: () => void;
}

const hubIcons: Record<string, LucideIcon> = {
  marketing: Building,
  sales: Building2,
  production: Layers,
  team: Users,
  strategy: Target,
  financials: LineChart,
  leadership: Brain,
};

export const SortableHub = ({
  id,
  title,
  promptCount,
  onDelete,
  isExpanded = true,
  onToggle = () => {}
}: SortableHubProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const HubIcon = hubIcons[id] || Building;

  return <div ref={setNodeRef} style={style} className={cn("p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all", isDragging && "opacity-50 shadow-lg")}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <HubIcon className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onToggle} className="p-1 hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-accent">
              <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>
        {onDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete hub</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>;
};
