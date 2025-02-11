
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParameterRuleCardProps {
  rule: any;
  onUpdate: () => void;
}

export function ParameterRuleCard({ rule, onUpdate }: ParameterRuleCardProps) {
  const { toast } = useToast();
  const { getTweaksForParameter } = usePromptParameters();
  const parameterTweaks = getTweaksForParameter(rule.parameter_id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
        description: "Failed to delete parameter rule",
      });
    }
  };

  const handleToggleActive = async (active: boolean) => {
    try {
      const { error } = await supabase
        .from("prompt_parameter_rules")
        .update({ is_active: active })
        .eq("id", rule.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        variant: "destructive",
        description: "Failed to update parameter rule",
      });
    }
  };

  const handleToggleRequired = async (required: boolean) => {
    try {
      const { error } = await supabase
        .from("prompt_parameter_rules")
        .update({ is_required: required })
        .eq("id", rule.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        variant: "destructive",
        description: "Failed to update parameter rule",
      });
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="relative border-2 hover:border-primary/50"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded-md"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <CardTitle className="text-base font-medium">
              {rule.parameter?.name}
            </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id={`active-${rule.id}`}
              checked={rule.is_active}
              onCheckedChange={handleToggleActive}
            />
            <Label htmlFor={`active-${rule.id}`}>Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={`required-${rule.id}`}
              checked={rule.is_required}
              onCheckedChange={handleToggleRequired}
            />
            <Label htmlFor={`required-${rule.id}`}>Required</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Allowed Tweaks</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select tweaks to allow" />
            </SelectTrigger>
            <SelectContent>
              {parameterTweaks.map((tweak) => (
                <SelectItem key={tweak.id} value={tweak.id}>
                  {tweak.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
