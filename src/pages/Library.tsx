
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { usePrompts, type Prompt } from "@/hooks/usePrompts";
import { CustomPromptWizard } from "@/components/prompts/CustomPromptWizard";
import { PromptTable } from "@/components/prompts/PromptTable";

const Library = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { toast } = useToast();
  const { prompts, isLoading, error, isAdmin } = usePrompts();

  const handleCustomizePrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsWizardOpen(true);
  };

  const copyToClipboard = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.prompt);
    toast({
      description: "Prompt copied to clipboard"
    });
  };

  const handleDeletePrompt = async () => {
    if (!deletePromptId) return;
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", deletePromptId);
      
      if (error) throw error;
      
      toast({
        description: "Prompt deleted successfully"
      });
      setDeletePromptId(null);
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete prompt. Please try again."
      });
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesFilter = filter === "all" || prompt.category === filter;
    const matchesSearch = searchQuery === "" || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>Loading prompts...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>Error loading prompts. Please try again later.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Content Generation Library</h2>
            <p className="text-muted-foreground mt-2">
              Browse and customize AI prompts
            </p>
          </div>
          <PromptFilters
            filter={filter}
            searchQuery={searchQuery}
            onFilterChange={setFilter}
            onSearchChange={setSearchQuery}
          />
        </div>

        <PromptTable
          prompts={filteredPrompts}
          isAdmin={isAdmin}
          onCustomize={handleCustomizePrompt}
          onCopy={copyToClipboard}
          onDelete={prompt => setDeletePromptId(prompt.id)}
        />

        <CustomPromptWizard
          basePrompt={selectedPrompt}
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setSelectedPrompt(null);
          }}
        />

        <AlertDialog
          open={!!deletePromptId}
          onOpenChange={open => !open && setDeletePromptId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the prompt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePrompt}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Library;
