
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { usePrompts, type Prompt } from "@/hooks/usePrompts";
import { CustomPromptWizard } from "@/components/prompts/CustomPromptWizard";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const Library = () => {
  const { hubArea } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('[Library] Rendering Library page', {
    pathname: location.pathname,
    hubArea,
    search: location.search,
    renderCount: Math.random()
  });

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(() => {
    // Initialize from URL search params
    const params = new URLSearchParams(location.search);
    return params.get('category');
  });
  
  const { toast } = useToast();
  
  const { 
    prompts, 
    isLoading, 
    error, 
    isAdmin,
    getHubRoot,
    getSubcategories,
    getPromptsForCategory,
    getPromptsByCategory,
  } = usePrompts(hubArea);

  // Update URL when category changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (currentCategoryId) {
      searchParams.set('category', currentCategoryId);
    } else {
      searchParams.delete('category');
    }
    
    // Update URL without triggering navigation
    const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentCategoryId, location.pathname]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentCategoryId(params.get('category'));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Get the current category if one is selected
  const currentCategory = currentCategoryId 
    ? prompts.find(p => p.id === currentCategoryId)
    : null;

  // Get categorized prompts for the current hub
  const categorizedPrompts = hubArea ? getPromptsByCategory() : [];
  
  // Filter prompts based on search and category
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

  const handleCategorySelect = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setSearchQuery(""); // Reset search when changing category
  };

  const handleNavigateBack = () => {
    if (currentCategory) {
      setCurrentCategoryId(null);
    } else {
      navigate("/library");
    }
  };

  if (isLoading) {
    return <div>Loading prompts...</div>;
  }

  if (error) {
    return <div>Error loading prompts. Please try again later.</div>;
  }

  const getHubTitle = () => {
    if (!hubArea) return "Content Generation Library";
    return hubArea.charAt(0).toUpperCase() + hubArea.slice(1);
  };

  const getHubDescription = () => {
    if (!hubArea) return "Browse and customize AI prompts";
    
    const descriptions: Record<string, string> = {
      marketing: "Generate content for your marketing campaigns",
      sales: "Create compelling sales copy and proposals",
      production: "Streamline your content production workflow",
      team: "Improve team communication and collaboration",
      strategy: "Develop effective business strategies and plans",
      financials: "Generate financial reports and analysis",
      leadership: "Enhance your leadership and management skills"
    };
    
    return descriptions[hubArea] || "Browse and customize AI prompts";
  };

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/library")}>
              Content Generation Library
            </BreadcrumbLink>
          </BreadcrumbItem>
          {hubArea && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => {
                  setCurrentCategoryId(null);
                  navigate(`/library/${hubArea}`);
                }}>
                  {getHubTitle()}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
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
            {currentCategory ? currentCategory.title : getHubTitle()}
          </h2>
          <p className="text-muted-foreground mt-2">
            {currentCategory ? currentCategory.description : getHubDescription()}
          </p>
        </div>
        {(currentCategory || hubArea) && (
          <Button
            variant="outline"
            onClick={handleNavigateBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {currentCategory ? (hubArea ? getHubTitle() : "Categories") : "Categories"}
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

      <PromptGrid
        items={filteredPrompts}
        categorizedPrompts={categorizedPrompts}
        isAdmin={isAdmin}
        onCustomize={handleCustomizePrompt}
        onDelete={prompt => setDeletePromptId(prompt.id)}
        currentCategory={currentCategoryId}
        onCategorySelect={handleCategorySelect}
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
  );
};

export default Library;
