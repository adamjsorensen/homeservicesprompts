
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useSaveContent() {
  const { toast } = useToast();

  const saveGeneratedContent = async (content: string, userId: string, title: string) => {
    try {
      console.log("Saving generated content...");
      const { error } = await supabase.from("saved_generations").insert({
        content,
        user_id: userId,
        title,
      });

      if (error) throw error;

      console.log("Content saved successfully");
      toast({
        description: "Content saved automatically",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        description: "Failed to save content automatically",
      });
    }
  };

  const updateContent = async (content: string, userId: string, title: string) => {
    try {
      // Find the saved generation by title and user_id
      const { data: savedGeneration, error: findError } = await supabase
        .from("saved_generations")
        .select()
        .eq('user_id', userId)
        .eq('title', title)
        .single();

      if (findError) throw findError;

      // Update the content
      const { error: updateError } = await supabase
        .from("saved_generations")
        .update({ content })
        .eq('id', savedGeneration.id);

      if (updateError) throw updateError;

      toast({
        description: "Content saved successfully",
      });
      return true;
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        description: "Failed to save content",
      });
      return false;
    }
  };

  return { saveGeneratedContent, updateContent };
}
