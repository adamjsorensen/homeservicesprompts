
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PromptGenerationsAdmin() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: generations, isLoading } = useQuery({
    queryKey: ["prompt-generations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_generations")
        .select(`
          *,
          custom_prompt:custom_prompts(
            base_prompt:prompts(prompt),
            customizations:prompt_customizations(
              parameter_tweak:parameter_tweaks(sub_prompt)
            ),
            additional_context:prompt_additional_context(context_text)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const constructFinalPrompt = (generation: any) => {
    let finalPrompt = generation.custom_prompt?.base_prompt?.prompt || '';
    
    // Add customizations
    if (generation.custom_prompt?.customizations) {
      for (const customization of generation.custom_prompt.customizations) {
        finalPrompt += "\n" + customization.parameter_tweak?.sub_prompt;
      }
    }

    // Add additional context if it exists
    if (generation.custom_prompt?.additional_context?.[0]?.context_text) {
      finalPrompt += "\n\nAdditional Context:\n" + generation.custom_prompt.additional_context[0].context_text;
    }

    return finalPrompt;
  };

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  if (isLoading) {
    return <div>Loading prompt generations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Prompt Generations</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Generated At</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Prompt</TableHead>
            <TableHead>Generated Content</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generations?.map((generation) => (
            <TableRow key={generation.id}>
              <TableCell>
                {format(new Date(generation.created_at), "PPp")}
              </TableCell>
              <TableCell>{generation.created_by}</TableCell>
              <TableCell>
                {expandedRows.has(generation.id)
                  ? constructFinalPrompt(generation)
                  : constructFinalPrompt(generation).slice(0, 100) + "..."}
              </TableCell>
              <TableCell>
                {expandedRows.has(generation.id)
                  ? generation.generated_content
                  : generation.generated_content.slice(0, 100) + "..."}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleRow(generation.id)}
                >
                  {expandedRows.has(generation.id) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
