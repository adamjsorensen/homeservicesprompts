
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PARAMETER_TYPES } from "@/constants/parameterTypes";
import { parameterSchema, type ParameterFormData } from "@/schemas/parameterSchema";
import { PromptParameter } from "@/hooks/usePromptParameters";

export const useParameterForm = (
  parameter: PromptParameter | null,
  open: boolean,
  onOpenChange: (open: boolean) => void
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ParameterFormData>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      name: "",
      description: "",
      type: PARAMETER_TYPES[0],
    },
  });

  useEffect(() => {
    if (parameter && open) {
      form.reset({
        name: parameter.name,
        description: parameter.description || "",
        type: parameter.type as typeof PARAMETER_TYPES[number],
      });
    } else if (!parameter && open) {
      form.reset({
        name: "",
        description: "",
        type: PARAMETER_TYPES[0],
      });
    }
  }, [parameter, open, form]);

  const onSubmit = async (data: ParameterFormData) => {
    try {
      if (parameter?.id) {
        const { error } = await supabase
          .from("prompt_parameters")
          .update({
            name: data.name,
            description: data.description,
            type: data.type,
          })
          .eq("id", parameter.id);

        if (error) throw error;

        toast({
          description: "Parameter updated successfully",
        });
      } else {
        const { error } = await supabase.from("prompt_parameters").insert({
          name: data.name,
          description: data.description,
          type: data.type,
        });

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

  return { form, onSubmit };
};
