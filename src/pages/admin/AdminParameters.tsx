
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit2, Plus, Trash2, User } from "lucide-react";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Tweak {
  title: string;
  content: string;
}

interface Parameter {
  name: string;
  tweaks: Tweak[];
}

const AdminParameters = () => {
  const { parameters, tweaks } = usePromptParameters();
  const { toast } = useToast();
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [isEditingParameter, setIsEditingParameter] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<any>(null);
  const [newParameter, setNewParameter] = useState<Parameter>({
    name: "",
    tweaks: [{ title: "", content: "" }]
  });
  const [editedParameter, setEditedParameter] = useState<Parameter>({
    name: "",
    tweaks: []
  });

  const handleAddParameter = async () => {
    try {
      console.log('Creating new parameter:', {
        parameter: {
          name: newParameter.name,
          type: 'tone_and_style'
        }
      });

      const { data: param, error: paramError } = await supabase
        .from('prompt_parameters')
        .insert({
          name: newParameter.name,
          type: 'tone_and_style'
        })
        .select()
        .single();

      if (paramError) {
        console.error('Error creating parameter:', paramError);
        throw paramError;
      }

      const tweaksData = newParameter.tweaks.map(t => ({
        title: t.title,
        content: t.content
      }));
      
      console.log('Updating parameter tweaks:', {
        parameterId: param.id,
        tweaksData,
        tweaksDataType: typeof tweaksData
      });

      const { error: tweaksError } = await supabase
        .rpc('batch_update_parameter_tweaks', {
          p_parameter_id: param.id,
          p_tweaks: tweaksData
        });

      if (tweaksError) {
        console.error('Error updating tweaks:', tweaksError);
        throw tweaksError;
      }

      setIsAddingParameter(false);
      setNewParameter({ name: "", tweaks: [{ title: "", content: "" }] });
      
      toast({
        title: "Parameter added",
        description: "The parameter has been created successfully.",
      });
    } catch (error) {
      console.error('Error adding parameter:', {
        error,
        parameterData: newParameter,
        tweaksData: newParameter.tweaks
      });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create parameter. Please try again.",
      });
    }
  };

  const handleEditParameter = async () => {
    try {
      if (!selectedParameter) return;

      console.log('Updating parameter:', {
        parameterId: selectedParameter.id,
        updatedData: {
          name: editedParameter.name
        }
      });

      const { error: paramError } = await supabase
        .from('prompt_parameters')
        .update({
          name: editedParameter.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedParameter.id);

      if (paramError) {
        console.error('Error updating parameter:', paramError);
        throw paramError;
      }

      const tweaksData = editedParameter.tweaks.map(t => ({
        title: t.title,
        content: t.content
      }));

      console.log('Updating parameter tweaks:', {
        parameterId: selectedParameter.id,
        tweaksData
      });

      const { error: tweaksError } = await supabase
        .rpc('batch_update_parameter_tweaks', {
          p_parameter_id: selectedParameter.id,
          p_tweaks: tweaksData
        });

      if (tweaksError) {
        console.error('Error updating tweaks:', tweaksError);
        throw tweaksError;
      }

      setIsEditingParameter(false);
      setSelectedParameter(null);
      setEditedParameter({ name: "", tweaks: [] });

      toast({
        title: "Parameter updated",
        description: "The parameter has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating parameter:', {
        error,
        parameterData: editedParameter,
        tweaksData: editedParameter.tweaks
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update parameter. Please try again.",
      });
    }
  };

  const handleAddTweak = (isEditing: boolean) => {
    if (isEditing) {
      setEditedParameter({
        ...editedParameter,
        tweaks: [...editedParameter.tweaks, { title: "", content: "" }]
      });
    } else {
      setNewParameter({
        ...newParameter,
        tweaks: [...newParameter.tweaks, { title: "", content: "" }]
      });
    }
  };

  const handleRemoveTweak = (index: number, isEditing: boolean) => {
    if (isEditing) {
      setEditedParameter({
        ...editedParameter,
        tweaks: editedParameter.tweaks.filter((_, i) => i !== index)
      });
    } else {
      setNewParameter({
        ...newParameter,
        tweaks: newParameter.tweaks.filter((_, i) => i !== index)
      });
    }
  };

  const handleStartEditing = (param: any) => {
    const paramTweaks = tweaks
      .filter(t => t.parameter_id === param.id && t.active)
      .map(t => ({
        title: t.name,
        content: t.sub_prompt
      }));

    setEditedParameter({
      name: param.name,
      tweaks: paramTweaks
    });
    setSelectedParameter(param);
    setIsEditingParameter(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Parameters</h1>
          <p className="text-muted-foreground">
            Manage parameters and their tweaks
          </p>
        </div>
        <Button onClick={() => setIsAddingParameter(true)} className="bg-[#9b87f5] hover:bg-[#8b77e5]">
          <Plus className="w-4 h-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Tweaks</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters
              .filter(param => param.active)
              .map((param) => {
                const paramTweaks = tweaks.filter((t) => t.parameter_id === param.id && t.active);
                return (
                  <TableRow key={param.id}>
                    <TableCell className="font-medium">{param.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {paramTweaks.map((tweak) => (
                          <span
                            key={tweak.id}
                            className="bg-muted text-muted-foreground px-3 py-1 rounded-md text-sm"
                          >
                            {tweak.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEditing(param)}
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
                );
              })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddingParameter} onOpenChange={setIsAddingParameter}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Parameter</DialogTitle>
            <p className="text-muted-foreground">
              Create a new parameter with custom tweaks
            </p>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Parameter Name</Label>
              <div className="relative">
                <Input
                  placeholder="e.g., Writing Style"
                  value={newParameter.name}
                  onChange={(e) =>
                    setNewParameter({ ...newParameter, name: e.target.value })
                  }
                />
                <User className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Tweaks</Label>
              {newParameter.tweaks.map((tweak, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveTweak(index, false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Title (Visible to Users)</Label>
                    <Input
                      placeholder="e.g., Professional"
                      value={tweak.title}
                      onChange={(e) => {
                        const newTweaks = [...newParameter.tweaks];
                        newTweaks[index].title = e.target.value;
                        setNewParameter({ ...newParameter, tweaks: newTweaks });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content (Added to Prompt)</Label>
                    <Textarea
                      placeholder="e.g., Maintain a formal and business-appropriate tone"
                      value={tweak.content}
                      onChange={(e) => {
                        const newTweaks = [...newParameter.tweaks];
                        newTweaks[index].content = e.target.value;
                        setNewParameter({ ...newParameter, tweaks: newTweaks });
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddTweak(false);
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tweak
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingParameter(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddParameter()} className="bg-[#9b87f5] hover:bg-[#8b77e5]">
              Add Parameter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingParameter} onOpenChange={setIsEditingParameter}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Parameter</DialogTitle>
            <p className="text-muted-foreground">
              Modify parameter details and tweaks
            </p>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Parameter Name</Label>
              <div className="relative">
                <Input
                  placeholder="e.g., Writing Style"
                  value={editedParameter.name}
                  onChange={(e) =>
                    setEditedParameter({ ...editedParameter, name: e.target.value })
                  }
                />
                <User className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Tweaks</Label>
              {editedParameter.tweaks.map((tweak, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveTweak(index, true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Title (Visible to Users)</Label>
                    <Input
                      placeholder="e.g., Professional"
                      value={tweak.title}
                      onChange={(e) => {
                        const newTweaks = [...editedParameter.tweaks];
                        newTweaks[index].title = e.target.value;
                        setEditedParameter({ ...editedParameter, tweaks: newTweaks });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content (Added to Prompt)</Label>
                    <Textarea
                      placeholder="e.g., Maintain a formal and business-appropriate tone"
                      value={tweak.content}
                      onChange={(e) => {
                        const newTweaks = [...editedParameter.tweaks];
                        newTweaks[index].content = e.target.value;
                        setEditedParameter({ ...editedParameter, tweaks: newTweaks });
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddTweak(true);
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tweak
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingParameter(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleEditParameter()} className="bg-[#9b87f5] hover:bg-[#8b77e5]">
              Update Parameter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminParameters;
