
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

  // Filter prompts by hub area if specified
  const filteredPrompts = hubArea 
    ? prompts.filter(prompt => prompt.hub_area === hubArea)
    : prompts;

  return { prompts: filteredPrompts, isLoading, error, isAdmin };
};
