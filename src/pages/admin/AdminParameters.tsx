
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Settings2, Link2, MoreHorizontal } from "lucide-react";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { PARAMETER_TYPES } from "@/constants/parameterTypes";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminParameters = () => {
  const { parameters, tweaks } = usePromptParameters();
  const { toast } = useToast();
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [isAddingTweak, setIsAddingTweak] = useState(false);
  const [newParameter, setNewParameter] = useState({
    name: "",
    description: "",
    type: PARAMETER_TYPES[0],
  });
  const [newTweak, setNewTweak] = useState({
    name: "",
    sub_prompt: "",
  });

  const handleAddParameter = async () => {
    try {
      const { error } = await supabase.from("prompt_parameters").insert([
        {
          name: newParameter.name,
          description: newParameter.description,
          type: newParameter.type,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Parameter added",
        description: "The parameter has been created successfully.",
      });

      setIsAddingParameter(false);
      setNewParameter({ name: "", description: "", type: PARAMETER_TYPES[0] });
    } catch (error) {
      console.error("Error adding parameter:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create parameter. Please try again.",
      });
    }
  };

  const handleAddTweak = async () => {
    try {
      const { error } = await supabase.from("parameter_tweaks").insert([
        {
          name: newTweak.name,
          sub_prompt: newTweak.sub_prompt,
          parameter_id: selectedParameter,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Tweak added",
        description: "The tweak has been created successfully.",
      });

      setIsAddingTweak(false);
      setNewTweak({ name: "", sub_prompt: "" });
    } catch (error) {
      console.error("Error adding tweak:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create tweak. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parameter System</h1>
          <p className="text-muted-foreground">
            Configure parameters and tweaks for prompts
          </p>
        </div>
        <Button onClick={() => setIsAddingParameter(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PARAMETER_TYPES.map((type) => {
          const typeParameters = parameters.filter((p) => p.type === type);
          return (
            <div
              key={type}
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </h3>
                <Settings2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {typeParameters.length} parameters
              </p>
              <div className="space-y-3">
                {typeParameters.map((param) => {
                  const paramTweaks = tweaks.filter(
                    (t) => t.parameter_id === param.id
                  );
                  return (
                    <div
                      key={param.id}
                      className="p-3 rounded-md bg-muted/50 space-y-2"
                      onClick={() => setSelectedParameter(param.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{param.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedParameter(param.id);
                            setIsAddingTweak(true);
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {paramTweaks.length > 0 && (
                        <div className="pl-3 border-l-2 border-muted space-y-1">
                          {paramTweaks.map((tweak) => (
                            <div
                              key={tweak.id}
                              className="flex items-center text-sm text-muted-foreground"
                            >
                              <Link2 className="w-3 h-3 mr-2" />
                              {tweak.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Parameter Dialog */}
      <Dialog open={isAddingParameter} onOpenChange={setIsAddingParameter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Parameter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Parameter Name</Label>
              <Input
                id="name"
                value={newParameter.name}
                onChange={(e) =>
                  setNewParameter({ ...newParameter, name: e.target.value })
                }
                placeholder="Enter parameter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newParameter.description}
                onChange={(e) =>
                  setNewParameter({ ...newParameter, description: e.target.value })
                }
                placeholder="Enter parameter description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Parameter Type</Label>
              <Select
                value={newParameter.type}
                onValueChange={(value) =>
                  setNewParameter({ ...newParameter, type: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameter type" />
                </SelectTrigger>
                <SelectContent>
                  {PARAMETER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").replace(/\b\w/g, (l) =>
                        l.toUpperCase()
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingParameter(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParameter}>Add Parameter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tweak Dialog */}
      <Dialog open={isAddingTweak} onOpenChange={setIsAddingTweak}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tweak</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tweakName">Tweak Name</Label>
              <Input
                id="tweakName"
                value={newTweak.name}
                onChange={(e) =>
                  setNewTweak({ ...newTweak, name: e.target.value })
                }
                placeholder="Enter tweak name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subPrompt">Sub-prompt</Label>
              <Textarea
                id="subPrompt"
                value={newTweak.sub_prompt}
                onChange={(e) =>
                  setNewTweak({ ...newTweak, sub_prompt: e.target.value })
                }
                placeholder="Enter sub-prompt text"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTweak(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTweak}>Add Tweak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminParameters;
