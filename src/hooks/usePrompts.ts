
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  is_category?: boolean;
  parent_id?: string | null;
  icon_name?: string | null;
  display_order?: number;
  hub_area?: string | null;
}

export interface CategoryWithPrompts {
  category: Prompt;
  prompts: Prompt[];
}

const fetchPrompts = async () => {
  console.log('[Fetching Prompts] Starting to fetch prompts');
  
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error('[Fetching Prompts] Error:', error);
    throw error;
  }

  console.log('[Fetching Prompts] Success:', data);
  return data;
};

const checkAdminRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('has_role', {
    user_id: user.id,
    role: 'admin'
  });

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return data;
};

export const usePrompts = (hubArea?: string) => {
  const { data: prompts = [], isLoading, error } = useQuery({
    queryKey: ["prompts", hubArea],
    queryFn: fetchPrompts,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: checkAdminRole,
  });

  // Get root categories for a hub area
  const getRootCategories = () => {
    return prompts.filter(prompt => 
      prompt.hub_area === hubArea && 
      prompt.is_category && 
      !prompt.parent_id
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  // Get subcategories for a category
  const getSubcategories = (categoryId: string) => {
    return prompts.filter(prompt => 
      prompt.is_category && 
      prompt.parent_id === categoryId
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  // Get prompts for a category
  const getPromptsForCategory = (categoryId: string) => {
    return prompts.filter(prompt => 
      !prompt.is_category && 
      prompt.parent_id === categoryId
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  // Get all prompts organized by category for a hub
  const getPromptsByCategory = (): CategoryWithPrompts[] => {
    const rootCategories = getRootCategories();
    
    return rootCategories.map(category => ({
      category,
      prompts: getPromptsForCategory(category.id),
    }));
  };

  // Filter prompts based on hub area
  const filteredPrompts = hubArea 
    ? prompts.filter(prompt => prompt.hub_area === hubArea)
    : prompts;

  return { 
    prompts: filteredPrompts, 
    isLoading, 
    error, 
    isAdmin,
    getRootCategories,
    getSubcategories,
    getPromptsForCategory,
    getPromptsByCategory,
  };
};
