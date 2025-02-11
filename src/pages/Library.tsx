
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromptForm } from "@/components/prompts/PromptForm";
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
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { usePrompts, type Prompt } from "@/hooks/usePrompts";
import { CustomPromptWizard } from "@/components/prompts/CustomPromptWizard";

const Library = () => {
  const [filter, setFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { toast } = useToast();
  
  const { prompts, isLoading, error, isAdmin } = usePrompts();

  const handleCustomizePrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsWizardOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      description: "Prompt copied to clipboard",
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
        description: "Prompt deleted successfully",
      });
      setDeletePromptId(null);
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete prompt. Please try again.",
      });
    }
  };

  const filteredPrompts = prompts.filter((prompt) => {
    if (filter === "all") return true;
    return prompt.category.toLowerCase() === filter.toLowerCase();
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
            <h2 className="text-3xl font-bold tracking-tight">Prompt Library</h2>
            <p className="text-muted-foreground mt-2">
              Browse and customize AI prompts
            </p>
          </div>
          <PromptFilters
            filter={filter}
            onFilterChange={setFilter}
            onCreateClick={() => setIsCreateDialogOpen(true)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isAdmin={isAdmin}
              onCustomize={() => handleCustomizePrompt(prompt)}
              onCopy={() => copyToClipboard(prompt.prompt)}
              onDelete={() => setDeletePromptId(prompt.id)}
            />
          ))}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
          </DialogHeader>
          <PromptForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <CustomPromptWizard
        basePrompt={selectedPrompt}
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedPrompt(null);
        }}
      />

      <AlertDialog open={!!deletePromptId} onOpenChange={(open) => !open && setDeletePromptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the prompt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePrompt} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Library;
