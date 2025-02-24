
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { usePrompts, type Prompt } from "@/hooks/usePrompts";
import { CustomPromptWizard } from "@/components/prompts/CustomPromptWizard";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";

const Library = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { prompts, isLoading, error, isAdmin } = usePrompts();

  const currentCategory = prompts.find(p => p.id === currentCategoryId);
  
  const filteredPrompts = prompts.filter(prompt => {
    // Filter by parent category
    const matchesCategory = !currentCategoryId || prompt.parent_id === currentCategoryId;
    
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleCustomizePrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsWizardOpen(true);
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
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => setCurrentCategoryId(null)}>
                  Content Generation Library
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentCategory && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentCategory.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex justify-between items-center mt-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {currentCategory ? currentCategory.title : "Content Generation Library"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {currentCategory ? currentCategory.description : "Browse and customize AI prompts"}
              </p>
            </div>
            {currentCategory && (
              <Button
                variant="outline"
                onClick={() => setCurrentCategoryId(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Categories
              </Button>
            )}
          </div>

          <div className="mt-4">
            <PromptFilters
              filter={filter}
              searchQuery={searchQuery}
              onFilterChange={setFilter}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        <PromptGrid
          items={filteredPrompts}
          isAdmin={isAdmin}
          onCustomize={handleCustomizePrompt}
          onDelete={prompt => setDeletePromptId(prompt.id)}
          currentCategory={currentCategoryId}
          onCategorySelect={setCurrentCategoryId}
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
