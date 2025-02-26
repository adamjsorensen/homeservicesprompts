
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
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AdminPrompts = () => {
  const { prompts, isAdmin } = usePrompts();
  const { parameters, tweaks } = usePromptParameters();
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [editedPrompt, setEditedPrompt] = useState({
    name: "",
    description: "",
    selectedParameters: new Set<string>()
  });

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setEditedPrompt({
      name: prompt.title,
      description: prompt.description,
      selectedParameters: new Set() // TODO: Load actual selected parameters
    });
    setIsEditingPrompt(true);
  };

  const handleUpdatePrompt = () => {
    // TODO: Implement update logic
    setIsEditingPrompt(false);
  };

  const getEnabledTweaksText = (promptId: string) => {
    // TODO: Replace with actual logic to get enabled tweaks
    const targetAudienceTweaks = 2;
    const toneTweaks = 2;
    return `4 tweaks enabled\nTarget Audience (${targetAudienceTweaks} tweaks), Tone (${toneTweaks} tweaks)`;
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
        <Button className="bg-[#9b87f5] hover:bg-[#8b77e5]">
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
                  {getEnabledTweaksText(prompt.id)}
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
            <DialogTitle>Edit Prompt</DialogTitle>
            <p className="text-muted-foreground">
              Modify prompt details and parameters
            </p>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Name</Label>
              <Input
                value={editedPrompt.name}
                onChange={(e) =>
                  setEditedPrompt({ ...editedPrompt, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-4">
              <Label>Description</Label>
              <Textarea
                value={editedPrompt.description}
                onChange={(e) =>
                  setEditedPrompt({ ...editedPrompt, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-4">
              <Label>Parameters</Label>
              <div className="flex flex-wrap gap-2">
                {parameters.map((param) => (
                  <Badge
                    key={param.id}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer"
                  >
                    {param.name}
                  </Badge>
                ))}
              </div>
              {parameters.map((param) => (
                <div key={param.id} className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{param.name}</h3>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="pl-6 space-y-2">
                    {tweaks
                      .filter((tweak) => tweak.parameter_id === param.id)
                      .map((tweak) => (
                        <div key={tweak.id} className="flex items-center space-x-2">
                          <Checkbox id={tweak.id} />
                          <Label htmlFor={tweak.id}>{tweak.name}</Label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrompt} className="bg-[#9b87f5] hover:bg-[#8b77e5]">
              Update Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPrompts;
