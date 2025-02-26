
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { PromptParameterSelector } from "@/components/admin/PromptParameterSelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminPrompts = () => {
  const { prompts, isAdmin } = usePrompts();
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [editedPrompt, setEditedPrompt] = useState({
    name: "",
    description: "",
    basePrompt: "",
  });
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(new Set());
  const [enabledTweaks, setEnabledTweaks] = useState<Record<string, Set<string>>>({});

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setEditedPrompt({
      name: prompt.title,
      description: prompt.description,
      basePrompt: prompt.prompt,
    });
    setIsEditingPrompt(true);
  };

  const handleParameterToggle = (parameterId: string, enabled: boolean) => {
    setSelectedParameters((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(parameterId);
        // Initialize enabled tweaks for this parameter
        setEnabledTweaks((prev) => ({
          ...prev,
          [parameterId]: new Set(),
        }));
      } else {
        next.delete(parameterId);
        // Clean up enabled tweaks for this parameter
        setEnabledTweaks((prev) => {
          const { [parameterId]: _, ...rest } = prev;
          return rest;
        });
      }
      return next;
    });
  };

  const handleTweakToggle = (
    parameterId: string,
    tweakId: string,
    enabled: boolean
  ) => {
    setEnabledTweaks((prev) => {
      const parameterTweaks = new Set(prev[parameterId] || new Set());
      if (enabled) {
        parameterTweaks.add(tweakId);
      } else {
        parameterTweaks.delete(tweakId);
      }
      return {
        ...prev,
        [parameterId]: parameterTweaks,
      };
    });
  };

  const handleCreatePrompt = async () => {
    try {
      // Insert the new prompt
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: editedPrompt.name,
          description: editedPrompt.description,
          prompt: editedPrompt.basePrompt,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Create parameter rules and enabled tweaks
      const parameterPromises = Array.from(selectedParameters).map(async (parameterId) => {
        // Create parameter rule
        const { error: ruleError } = await supabase
          .from('prompt_parameter_rules')
          .insert({
            prompt_id: promptData.id,
            parameter_id: parameterId,
            is_required: true,
            is_active: true,
          });

        if (ruleError) throw ruleError;

        // Create enabled tweaks entries
        const tweakPromises = Array.from(enabledTweaks[parameterId] || []).map(
          (tweakId) =>
            supabase.from('prompt_parameter_enabled_tweaks').insert({
              prompt_id: promptData.id,
              parameter_id: parameterId,
              parameter_tweak_id: tweakId,
              is_enabled: true,
            })
        );

        await Promise.all(tweakPromises);
      });

      await Promise.all(parameterPromises);

      toast.success("Prompt created successfully");
      setIsEditingPrompt(false);
      setEditedPrompt({
        name: "",
        description: "",
        basePrompt: "",
      });
      setSelectedParameters(new Set());
      setEnabledTweaks({});
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast.error("Failed to create prompt");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Prompts</h1>
          <p className="text-muted-foreground">
            Manage your content generation prompts
          </p>
        </div>
        <Button 
          className="bg-[#9b87f5] hover:bg-[#8b77e5]"
          onClick={() => setIsEditingPrompt(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Prompt
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Parameters</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>{prompt.title}</TableCell>
                <TableCell>{prompt.description}</TableCell>
                <TableCell className="max-w-[300px]">
                  {/* We'll implement this later */}
                  Parameters info here
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPrompt(prompt)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditingPrompt} onOpenChange={setIsEditingPrompt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPrompt ? "Edit Prompt" : "Create New Prompt"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editedPrompt.name}
                  onChange={(e) =>
                    setEditedPrompt({ ...editedPrompt, name: e.target.value })
                  }
                  placeholder="Enter prompt name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editedPrompt.description}
                  onChange={(e) =>
                    setEditedPrompt({ ...editedPrompt, description: e.target.value })
                  }
                  placeholder="Enter prompt description"
                />
              </div>
              <div>
                <Label>Base Prompt</Label>
                <Textarea
                  value={editedPrompt.basePrompt}
                  onChange={(e) =>
                    setEditedPrompt({ ...editedPrompt, basePrompt: e.target.value })
                  }
                  placeholder="Enter base prompt text"
                />
              </div>
              <div>
                <Label>Parameters</Label>
                <PromptParameterSelector
                  selectedParameters={selectedParameters}
                  enabledTweaks={enabledTweaks}
                  onParameterToggle={handleParameterToggle}
                  onTweakToggle={handleTweakToggle}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPrompt(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePrompt} 
              className="bg-[#9b87f5] hover:bg-[#8b77e5]"
            >
              {selectedPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPrompts;
