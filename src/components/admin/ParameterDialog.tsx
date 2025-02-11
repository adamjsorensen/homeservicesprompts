
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const parameterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
});

interface ParameterDialogProps {
  parameter: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PARAMETER_TYPES = [
  "tone_and_style",
  "audience_specificity",
  "purpose_and_intent",
  "content_details",
  "output_format",
  "length_and_depth",
  "call_to_action",
  "customization_branding",
  "constraints",
  "iteration_feedback",
] as const;

export function ParameterDialog({
  parameter,
  open,
  onOpenChange,
}: ParameterDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof parameterSchema>>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      name: parameter?.name ?? "",
      description: parameter?.description ?? "",
      type: parameter?.type ?? "",
    },
  });

  const onSubmit = async (data: z.infer<typeof parameterSchema>) => {
    try {
      if (parameter?.id) {
        const { error } = await supabase
          .from("prompt_parameters")
          .update(data)
          .eq("id", parameter.id);

        if (error) throw error;

        toast({
          description: "Parameter updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("prompt_parameters")
          .insert(data);

        if (error) throw error;

        toast({
          description: "Parameter created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["prompt_parameters"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving parameter:", error);
      toast({
        variant: "destructive",
        description: "Failed to save parameter",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {parameter ? "Edit Parameter" : "Create Parameter"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PARAMETER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {parameter ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
