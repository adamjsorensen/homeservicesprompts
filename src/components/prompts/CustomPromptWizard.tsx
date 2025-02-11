import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/components/ui/use-toast";
import { LoadingCard } from "./LoadingCard";
import { Progress } from "@/components/ui/progress";

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
  const navigate = useNavigate();
  const [currentParameterIndex, setCurrentParameterIndex] = useState(0);
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { parameters, getTweaksForParameter, tweaks, isLoading } = usePromptParameters();
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  if (!basePrompt) return null;

  // Load parameter rules for the prompt
  const loadRules = async () => {
    try {
      setIsLoadingRules(true);
      const { data, error } = await supabase
        .from("prompt_parameter_rules")
        .select(`
          *,
          parameter:prompt_parameters(*)
        `)
        .eq("prompt_id", basePrompt.id)
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
      setIsLoadingRules(false);
    }
  };

  useEffect(() => {
    if (basePrompt && isOpen) {
      loadRules();
    }
  }, [basePrompt, isOpen]);

  const currentRule = rules[currentParameterIndex];
  const currentParameter = currentRule?.parameter;
  const parameterTweaks = currentParameter ? getTweaksForParameter(currentParameter.id) : [];
  
  const selectedTweak = tweaks.find(
    (tweak) => tweak.id === selectedTweaks[currentParameter?.id]
  );

  const progress = ((currentParameterIndex + 1) / rules.length) * 100;

  const handleTweakSelect = (tweakId: string) => {
    setSelectedTweaks(prev => ({
      ...prev,
      [currentParameter.id]: tweakId,
    }));
  };

  const handleSkip = () => {
    if (currentParameterIndex < rules.length - 1) {
      setCurrentParameterIndex(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentParameterIndex < rules.length - 1) {
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
      setIsGenerating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: customPrompt, error: customPromptError } = await supabase
        .from("custom_prompts")
        .insert({
          base_prompt_id: basePrompt.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (customPromptError) throw customPromptError;

      // Only include selected tweaks (skip those that were skipped)
      const customizations = Object.entries(selectedTweaks)
        .filter(([parameterId, tweakId]) => tweakId) // Filter out undefined/null tweaks
        .map(([parameterId, tweakId]) => ({
          custom_prompt_id: customPrompt.id,
          parameter_tweak_id: tweakId,
        }));

      if (customizations.length > 0) {
        const { error: customizationsError } = await supabase
          .from("prompt_customizations")
          .insert(customizations);

        if (customizationsError) throw customizationsError;
      }

      const { data: generatedData, error: generateError } = await supabase.functions
        .invoke('generate-prompt-content', {
          body: { customPromptId: customPrompt.id, userId: user.id }
        });

      if (generateError) throw generateError;

      onClose();
      navigate("/generated-content", {
        state: {
          generatedContent: generatedData.generatedContent,
          promptTitle: basePrompt.title,
        }
      });
    } catch (error) {
      console.error("Error saving custom prompt:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save custom prompt and generate content.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || isLoadingRules || !currentRule) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading parameters...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <LoadingCard />
          </div>
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
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentParameterIndex + 1} of {rules.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {currentParameter && !isGenerating && (
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

          {isGenerating && (
            <LoadingCard />
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentParameterIndex === 0 || isGenerating}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {!currentRule.is_required && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isGenerating}
                >
                  Skip
                </Button>
              )}
              {currentParameterIndex < rules.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!selectedTweaks[currentParameter?.id] && currentRule.is_required || isGenerating}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={!selectedTweaks[currentParameter?.id] && currentRule.is_required || isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Content"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
