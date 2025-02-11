
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
import { usePromptParameters } from "@/hooks/usePromptParameters";

const tweakSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parameter_id: z.string().min(1, "Parameter is required"),
  sub_prompt: z.string().min(1, "Sub prompt is required"),
});

interface TweakDialogProps {
  tweak: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TweakDialog({ tweak, open, onOpenChange }: TweakDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { parameters } = usePromptParameters();

  const form = useForm<z.infer<typeof tweakSchema>>({
    resolver: zodResolver(tweakSchema),
    defaultValues: {
      name: tweak?.name ?? "",
      parameter_id: tweak?.parameter_id ?? "",
      sub_prompt: tweak?.sub_prompt ?? "",
    },
  });

  const onSubmit = async (data: z.infer<typeof tweakSchema>) => {
    try {
      if (tweak?.id) {
        const { error } = await supabase
          .from("parameter_tweaks")
          .update({
            name: data.name,
            parameter_id: data.parameter_id,
            sub_prompt: data.sub_prompt,
          })
          .eq("id", tweak.id);

        if (error) throw error;

        toast({
          description: "Tweak updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("parameter_tweaks")
          .insert({
            name: data.name,
            parameter_id: data.parameter_id,
            sub_prompt: data.sub_prompt,
          });

        if (error) throw error;

        toast({
          description: "Tweak created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["parameter_tweaks"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving tweak:", error);
      toast({
        variant: "destructive",
        description: "Failed to save tweak",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tweak?.id ? "Edit Tweak" : "Create Tweak"}
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
              name="parameter_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parameter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parameters.map((parameter) => (
                        <SelectItem key={parameter.id} value={parameter.id}>
                          {parameter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sub_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Prompt</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Save</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
