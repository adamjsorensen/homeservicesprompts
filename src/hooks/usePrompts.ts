
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading, error } = useQuery({
    queryKey: ["prompts", hubArea],
    queryFn: fetchPrompts,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: checkAdminRole,
  });

  // Set up real-time subscription
  useEffect(() => {
    console.log('[Real-time] Setting up prompts subscription');
    
    const channel = supabase
      .channel('prompts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts'
        },
        async (payload) => {
          console.log('[Real-time] Received change:', payload);
          
          // Refetch data to ensure we have the latest state
          await queryClient.invalidateQueries({ queryKey: ["prompts"] });
          
          // Optionally handle specific events differently
          switch (payload.eventType) {
            case 'INSERT':
              console.log('[Real-time] New prompt added:', payload.new);
              break;
            case 'UPDATE':
              console.log('[Real-time] Prompt updated:', payload.new);
              break;
            case 'DELETE':
              console.log('[Real-time] Prompt deleted:', payload.old);
              break;
          }
        }
      )
      .subscribe(status => {
        console.log('[Real-time] Subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get hub's root category
  const getHubRoot = () => {
    return prompts.find(prompt => 
      prompt.hub_area === hubArea && 
      prompt.is_category && 
      !prompt.parent_id
    );
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
    const hubRoot = getHubRoot();
    if (!hubRoot) return [];
    
    // Get first-level categories under the hub
    const categories = getSubcategories(hubRoot.id);
    
    return categories.map(category => ({
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
    getHubRoot,
    getSubcategories,
    getPromptsForCategory,
    getPromptsByCategory,
  };
};
