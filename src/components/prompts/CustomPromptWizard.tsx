
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { type Prompt } from "@/hooks/usePrompts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CustomPromptWizardProps {
  basePrompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomPromptWizard({
  basePrompt,
  isOpen,
  onClose,
}: CustomPromptWizardProps) {
  const [currentParameterIndex, setCurrentParameterIndex] = useState(0);
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const { parameters, getTweaksForParameter, tweaks, isLoading } = usePromptParameters();

  if (!basePrompt) return null;

  const currentParameter = parameters[currentParameterIndex];
  const parameterTweaks = currentParameter ? getTweaksForParameter(currentParameter.id) : [];
  
  // Find the selected tweak object to display its sub_prompt
  const selectedTweak = tweaks.find(
    (tweak) => tweak.id === selectedTweaks[currentParameter?.id]
  );

  const handleTweakSelect = (tweakId: string) => {
    setSelectedTweaks(prev => ({
      ...prev,
      [currentParameter.id]: tweakId,
    }));
  };

  const handleNext = () => {
    if (currentParameterIndex < parameters.length - 1) {
      setCurrentParameterIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentParameterIndex > 0) {
      setCurrentParameterIndex(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create custom prompt
      const { data: customPrompt, error: customPromptError } = await supabase
        .from("custom_prompts")
        .insert({
          base_prompt_id: basePrompt.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (customPromptError) throw customPromptError;

      // Create customizations
      const customizations = Object.entries(selectedTweaks).map(([parameterId, tweakId]) => ({
        custom_prompt_id: customPrompt.id,
        parameter_tweak_id: tweakId,
      }));

      const { error: customizationsError } = await supabase
        .from("prompt_customizations")
        .insert(customizations);

      if (customizationsError) throw customizationsError;

      onClose();
    } catch (error) {
      console.error("Error saving custom prompt:", error);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customize Prompt: {basePrompt.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentParameter && (
            <Card>
              <CardHeader>
                <CardTitle>{currentParameter.name}</CardTitle>
                <CardDescription>
                  {currentParameter.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedTweaks[currentParameter.id]}
                  onValueChange={handleTweakSelect}
                >
                  {parameterTweaks.map((tweak) => (
                    <div key={tweak.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={tweak.id} id={tweak.id} />
                      <Label htmlFor={tweak.id}>{tweak.name}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {selectedTweak && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedTweak.sub_prompt}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentParameterIndex === 0}
            >
              Previous
            </Button>
            {currentParameterIndex < parameters.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!selectedTweaks[currentParameter?.id]}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!selectedTweaks[currentParameter?.id]}
              >
                Save Custom Prompt
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
