
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { Edit, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { ParameterDialog } from "./ParameterDialog";
import { useToast } from "@/components/ui/use-toast";
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
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function PromptParametersAdmin() {
  const { parameters } = usePromptParameters();
  const [selectedParameter, setSelectedParameter] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEdit = (parameter: any) => {
    setSelectedParameter(parameter);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteParameterId) return;

    try {
      const { error } = await supabase
        .from("prompt_parameters")
        .delete()
        .eq("id", deleteParameterId);

      if (error) throw error;

      toast({
        description: "Parameter deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompt_parameters"] });
    } catch (error) {
      console.error("Error deleting parameter:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete parameter",
      });
    } finally {
      setDeleteParameterId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Parameters</h2>
        <Button
          onClick={() => {
            setSelectedParameter(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((parameter) => (
            <TableRow key={parameter.id}>
              <TableCell>{parameter.name}</TableCell>
              <TableCell>{parameter.type}</TableCell>
              <TableCell>{parameter.description}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(parameter)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteParameterId(parameter.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ParameterDialog
        parameter={selectedParameter}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <AlertDialog
        open={!!deleteParameterId}
        onOpenChange={() => setDeleteParameterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the parameter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
