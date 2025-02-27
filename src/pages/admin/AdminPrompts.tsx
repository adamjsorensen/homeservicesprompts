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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PromptParameterSelector } from "@/components/admin/PromptParameterSelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HubArea = 'marketing' | 'sales' | 'production' | 'team' | 'strategy' | 'financials' | 'leadership';

interface Category {
  id: string;
  title: string;
  hub_area: HubArea | null;
  parent_id: string | null;
  full_path: string;
}

const AdminPrompts = () => {
  const { prompts, isAdmin } = usePrompts();
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [selectedHubArea, setSelectedHubArea] = useState<HubArea | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState({
    name: "",
    description: "",
    basePrompt: "",
  });
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(new Set());
  const [enabledTweaks, setEnabledTweaks] = useState<Record<string, Set<string>>>({});

  const getCategoriesByHub = (hubArea: HubArea | ''): Category[] => {
    return prompts
      .filter(p => p.is_category && (!hubArea || p.hub_area === hubArea))
      .map(p => ({
        id: p.id,
        title: p.title,
        hub_area: p.hub_area as HubArea | null,
        parent_id: p.parent_id,
        full_path: p.title
      }));
  };

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setEditedPrompt({
      name: prompt.title,
      description: prompt.description,
      basePrompt: prompt.prompt,
    });
    setSelectedHubArea(prompt.hub_area || '');
    setSelectedCategory(prompt.parent_id || '');
    setIsEditingPrompt(true);
  };

  const handleParameterToggle = (parameterId: string, enabled: boolean) => {
    setSelectedParameters((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(parameterId);
        setEnabledTweaks((prev: Record<string, Set<string>>) => ({
          ...prev,
          [parameterId]: new Set<string>(),
        }));
      } else {
        next.delete(parameterId);
        setEnabledTweaks((prev: Record<string, Set<string>>) => {
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
    setEnabledTweaks((prev: Record<string, Set<string>>) => {
      const parameterTweaks = new Set(prev[parameterId] || new Set<string>());
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
      if (!selectedCategory) {
        toast.error("Please select a category");
        return;
      }

      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: editedPrompt.name,
          description: editedPrompt.description,
          prompt: editedPrompt.basePrompt,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          category: 'custom',
          display_order: 0,
          is_category: false,
          is_default: false,
          tags: [],
          parent_id: selectedCategory,
          hub_area: selectedHubArea || null,
        })
        .select()
        .single();

      if (promptError) throw promptError;

      const parameterPromises = Array.from(selectedParameters).map(async (parameterId, index) => {
        const { error: ruleError } = await supabase
          .from('prompt_parameter_rules')
          .insert({
            prompt_id: promptData.id,
            parameter_id: parameterId,
            is_required: true,
            is_active: true,
            order: index,
          });

        if (ruleError) throw ruleError;

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
      setSelectedHubArea('');
      setSelectedCategory('');
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast.error("Failed to create prompt");
    }
  };

  const handleDeletePrompt = async () => {
    if (!deletePromptId) return;

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', deletePromptId);

      if (error) throw error;
      
      toast.success("Prompt deleted successfully");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    } finally {
      setDeletePromptId(null);
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
              <TableHead>Hub Area</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.filter(p => !p.is_category).map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>{prompt.title}</TableCell>
                <TableCell>{prompt.description}</TableCell>
                <TableCell>{prompt.hub_area || '-'}</TableCell>
                <TableCell>
                  {prompts.find(p => p.id === prompt.parent_id)?.title || '-'}
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
                      onClick={() => setDeletePromptId(prompt.id)}
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
                <Label>Hub Area</Label>
                <Select
                  value={selectedHubArea}
                  onValueChange={(value: HubArea) => {
                    setSelectedHubArea(value);
                    setSelectedCategory(''); // Reset category when hub changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hub area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Hub Areas</SelectLabel>
                      {['marketing', 'sales', 'production', 'team', 'strategy', 'financials', 'leadership'].map((hub) => (
                        <SelectItem key={hub} value={hub}>
                          {hub.charAt(0).toUpperCase() + hub.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={!selectedHubArea}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedHubArea ? "Select category" : "Select hub area first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{selectedHubArea ? `${selectedHubArea.charAt(0).toUpperCase() + selectedHubArea.slice(1)} Categories` : "Categories"}</SelectLabel>
                      {getCategoriesByHub(selectedHubArea as HubArea).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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

      <AlertDialog open={!!deletePromptId} onOpenChange={() => setDeletePromptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the prompt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePrompt} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPrompts;
