
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
import { TweakDialog } from "./TweakDialog";
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

export function ParameterTweaksAdmin() {
  const { tweaks, parameters } = usePromptParameters();
  const [selectedTweak, setSelectedTweak] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTweakId, setDeleteTweakId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!deleteTweakId) return;

    try {
      const { error } = await supabase
        .from("parameter_tweaks")
        .delete()
        .eq("id", deleteTweakId);

      if (error) throw error;

      toast({
        description: "Tweak deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["parameter_tweaks"] });
    } catch (error) {
      console.error("Error deleting tweak:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete tweak",
      });
    } finally {
      setDeleteTweakId(null);
    }
  };

  const getParameterName = (parameterId: string) => {
    const parameter = parameters.find((p) => p.id === parameterId);
    return parameter?.name ?? "Unknown Parameter";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Tweaks</h2>
        <Button
          onClick={() => {
            setSelectedTweak(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tweak
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Parameter</TableHead>
            <TableHead>Sub Prompt</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tweaks.map((tweak) => (
            <TableRow key={tweak.id}>
              <TableCell>{tweak.name}</TableCell>
              <TableCell>{getParameterName(tweak.parameter_id!)}</TableCell>
              <TableCell>{tweak.sub_prompt}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTweak(tweak);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTweakId(tweak.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TweakDialog
        tweak={selectedTweak}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <AlertDialog
        open={!!deleteTweakId}
        onOpenChange={() => setDeleteTweakId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tweak.
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
