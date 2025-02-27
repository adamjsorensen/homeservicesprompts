
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
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
import { useToast } from "@/hooks/use-toast";
import { CategoryTree } from "@/components/admin/CategoryTree";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableHub } from "@/components/admin/SortableHub";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

type HubAreaType = "marketing" | "sales" | "production" | "team" | "strategy" | "financials" | "leadership";

const AdminHubs = () => {
  const { prompts } = usePrompts();
  const { toast } = useToast();
  const [deleteHubId, setDeleteHubId] = useState<HubAreaType | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [orderedHubs, setOrderedHubs] = useState<HubAreaType[]>([]);
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());

  if (orderedHubs.length === 0 && prompts.length > 0) {
    const hubAreas = [...new Set(prompts.map(prompt => prompt.hub_area))]
      .filter((area): area is HubAreaType => {
        const validAreas: HubAreaType[] = ["marketing", "sales", "production", "team", "strategy", "financials", "leadership"];
        return area !== null && validAreas.includes(area as HubAreaType);
      })
      .sort((a, b) => {
        const aOrder = prompts.find(p => p.hub_area === a)?.display_order || 0;
        const bOrder = prompts.find(p => p.hub_area === b)?.display_order || 0;
        return aOrder - bOrder;
      });
    setOrderedHubs(hubAreas);
  }

  const handleDeleteHub = async () => {
    if (!deleteHubId) return;

    try {
      toast({
        title: "Success",
        description: "Hub deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete hub",
      });
    } finally {
      setDeleteHubId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeleteCategoryId(categoryId);
  };

  const formatHubTitle = (hubArea: string) => {
    return hubArea.charAt(0).toUpperCase() + hubArea.slice(1) + " Hub";
  };

  const toggleHub = (hubId: string) => {
    const newExpanded = new Set(expandedHubs);
    if (newExpanded.has(hubId)) {
      newExpanded.delete(hubId);
    } else {
      newExpanded.add(hubId);
    }
    setExpandedHubs(newExpanded);
  };

  const getPromptCount = (hubArea: string) => {
    return prompts.filter(p => 
      p.hub_area === hubArea && 
      !p.is_category
    ).length;
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hub Management</h1>
          <p className="text-muted-foreground">
            Organize and manage your prompt hubs
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="bg-[#9b87f5] hover:bg-[#8b77e5]">
                <Plus className="w-4 h-4 mr-2" />
                Add Hub
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new hub for organizing prompts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        {orderedHubs.map((hubArea) => {
          const promptCount = getPromptCount(hubArea);
          const isExpanded = expandedHubs.has(hubArea);
          return (
            <div key={hubArea} className="space-y-2">
              <SortableHub
                id={hubArea}
                title={formatHubTitle(hubArea)}
                promptCount={promptCount}
                onDelete={() => setDeleteHubId(hubArea)}
                isExpanded={isExpanded}
                onToggle={() => toggleHub(hubArea)}
              />
              {isExpanded && (
                <div className="ml-8">
                  <CategoryTree
                    categories={prompts.filter(p => p.hub_area === hubArea)}
                    hubArea={hubArea}
                    onDeleteCategory={handleDeleteCategory}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteHubId} onOpenChange={() => setDeleteHubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hub</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this hub? All categories will be deleted, but prompts will be preserved and can be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Hub
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? All prompts will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDeleteCategoryId(null)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHubs;
