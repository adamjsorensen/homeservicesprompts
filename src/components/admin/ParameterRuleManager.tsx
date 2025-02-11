
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { ParameterRuleCard } from "./ParameterRuleCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParameterRuleManagerProps {
  promptId: string;
}

export function ParameterRuleManager({ promptId }: ParameterRuleManagerProps) {
  const { parameters, isLoading: isLoadingParameters } = usePromptParameters();
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (promptId) {
      loadRules();
    }
  }, [promptId]);

  const loadRules = async () => {
    try {
      console.log("Loading rules for prompt:", promptId);
      const { data, error } = await supabase
        .from("prompt_parameter_rules")
        .select(`
          *,
          parameter:prompt_parameters!prompt_parameter_rules_parameter_id_fkey(
            id,
            name,
            type,
            description
          )
        `)
        .eq("prompt_id", promptId)
        .order("order");

      if (error) throw error;
      
      console.log("Loaded rules:", data);
      setRules(data || []);
    } catch (error) {
      console.error("Error loading rules:", error);
      toast({
        variant: "destructive",
        description: "Failed to load parameter rules",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });

      // Update orders in database
      try {
        const updates = rules.map((rule, index) => ({
          id: rule.id,
          prompt_id: rule.prompt_id,
          parameter_id: rule.parameter_id,
          order: index,
          is_active: rule.is_active,
          is_required: rule.is_required,
        }));

        const { error } = await supabase
          .from("prompt_parameter_rules")
          .upsert(updates);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating rule order:", error);
        toast({
          variant: "destructive",
          description: "Failed to update parameter order",
        });
      }
    }
  };

  if (loading || isLoadingParameters) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Parameter Rules</h3>
        <Button 
          onClick={async () => {
            try {
              // Get parameters not already in rules
              const existingParameterIds = rules.map(r => r.parameter_id);
              const availableParameters = parameters.filter(
                p => !existingParameterIds.includes(p.id)
              );

              if (availableParameters.length === 0) {
                toast({
                  description: "All parameters have been added",
                });
                return;
              }

              const { error } = await supabase
                .from("prompt_parameter_rules")
                .insert({
                  prompt_id: promptId,
                  parameter_id: availableParameters[0].id,
                  order: rules.length,
                });

              if (error) throw error;
              loadRules();
            } catch (error) {
              console.error("Error adding parameter:", error);
              toast({
                variant: "destructive",
                description: "Failed to add parameter",
              });
            }
          }}
        >
          Add Parameter
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rules}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {rules.map((rule) => (
              <ParameterRuleCard
                key={rule.id}
                rule={rule}
                onUpdate={loadRules}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
