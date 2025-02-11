
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Trash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Tweak {
  id: string;
  name: string;
  sub_prompt: string;
}

interface ParameterRule {
  id: string;
  parameter: {
    name: string;
    type: string;
    description: string | null;
  };
  allowed_tweaks: {
    tweak: Tweak;
  }[];
  is_active: boolean;
  is_required: boolean;
}

interface ParameterRuleCardProps {
  rule: ParameterRule;
  onUpdate: () => void;
}

export function ParameterRuleCard({ rule, onUpdate }: ParameterRuleCardProps) {
  const { toast } = useToast();
  const [selectedTweaks, setSelectedTweaks] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Get all available tweaks for this parameter from the database
  const [availableTweaks, setAvailableTweaks] = useState<Tweak[]>([]);

  useEffect(() => {
    const loadTweaks = async () => {
      try {
        const { data, error } = await supabase
          .from('parameter_tweaks')
          .select('*')
          .eq('parameter_id', rule.parameter.id);

        if (error) throw error;
        setAvailableTweaks(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading tweaks:', error);
        toast({
          variant: "destructive",
          description: "Failed to load tweaks",
        });
        setIsLoading(false);
      }
    };

    loadTweaks();
  }, [rule.parameter.id]);

  useEffect(() => {
    if (rule.id) {
      loadSelectedTweaks();
    }
  }, [rule.id]);

  const loadSelectedTweaks = async () => {
    try {
      const { data, error } = await supabase
        .from("prompt_parameter_allowed_tweaks")
        .select("tweak_id")
        .eq("rule_id", rule.id);

      if (error) throw error;
      setSelectedTweaks(data?.map(item => item.tweak_id) || []);
    } catch (error) {
      console.error("Error loading selected tweaks:", error);
      toast({
        variant: "destructive",
        description: "Failed to load selected tweaks",
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

  const handleTweaksChange = async (tweakId: string) => {
    try {
      const newSelectedTweaks = selectedTweaks.includes(tweakId)
        ? selectedTweaks.filter(id => id !== tweakId)
        : [...selectedTweaks, tweakId];

      // Delete existing allowed tweaks
      await supabase
        .from("prompt_parameter_allowed_tweaks")
        .delete()
        .eq("rule_id", rule.id);

      // Insert new allowed tweaks
      if (newSelectedTweaks.length > 0) {
        const { error } = await supabase
          .from("prompt_parameter_allowed_tweaks")
          .insert(
            newSelectedTweaks.map(tweakId => ({
              rule_id: rule.id,
              tweak_id: tweakId,
            }))
          );

        if (error) throw error;
      }

      setSelectedTweaks(newSelectedTweaks);
      onUpdate();
    } catch (error) {
      console.error("Error updating allowed tweaks:", error);
      toast({
        variant: "destructive",
        description: "Failed to update allowed tweaks",
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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {isLoading 
                  ? "Loading tweaks..."
                  : selectedTweaks.length === 0 
                    ? "Select tweaks..."
                    : `${selectedTweaks.length} selected`}
              </Button>
            </PopoverTrigger>
            {!isLoading && availableTweaks && (
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search tweaks..." className="h-9" />
                  <CommandEmpty>No tweaks found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {availableTweaks.map((tweak) => (
                        <CommandItem
                          key={tweak.id}
                          onSelect={() => handleTweaksChange(tweak.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedTweaks.includes(tweak.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className={cn("h-4 w-4")} />
                            </div>
                            <div className="flex flex-col">
                              <span>{tweak.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {tweak.sub_prompt}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            )}
          </Popover>
          {selectedTweaks.length > 0 && availableTweaks && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTweaks.map((tweakId) => {
                const tweak = availableTweaks.find(t => t.id === tweakId);
                return tweak ? (
                  <Badge
                    key={tweakId}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleTweaksChange(tweakId)}
                  >
                    {tweak.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
