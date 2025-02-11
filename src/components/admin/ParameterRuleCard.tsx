
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical, Trash } from "lucide-react";
import { usePromptParameters } from "@/hooks/usePromptParameters";

interface Parameter {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

interface Rule {
  id: string;
  parameter_id: string;
  parameter: Parameter;
  is_active: boolean;
  is_required: boolean;
}

interface ParameterRuleCardProps {
  rule: Rule;
  onUpdate: () => void;
}

export function ParameterRuleCard({ rule, onUpdate }: ParameterRuleCardProps) {
  const { toast } = useToast();
  const { getTweaksForParameter } = usePromptParameters();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleChange = async (field: "is_active" | "is_required", value: boolean) => {
    try {
      const { error } = await supabase
        .from("prompt_parameter_rules")
        .update({ [field]: value })
        .eq("id", rule.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        variant: "destructive",
        description: "Failed to update rule",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("prompt_parameter_rules")
        .delete()
        .eq("id", rule.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete rule",
      });
    }
  };

  const availableTweaks = getTweaksForParameter(rule.parameter_id);

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="relative border-2 hover:border-primary/50"
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded-md"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{rule.parameter.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {rule.parameter.description}
                </p>
                {availableTweaks.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {availableTweaks.length} tweak{availableTweaks.length === 1 ? '' : 's'} available
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`active-${rule.id}`}
                    checked={rule.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleChange("is_active", checked)
                    }
                  />
                  <Label htmlFor={`active-${rule.id}`}>Active</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id={`required-${rule.id}`}
                    checked={rule.is_required}
                    onCheckedChange={(checked) =>
                      handleToggleChange("is_required", checked)
                    }
                  />
                  <Label htmlFor={`required-${rule.id}`}>Required</Label>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
