
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
}

const fetchPrompts = async () => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

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

export const usePrompts = () => {
  const { data: prompts = [], isLoading, error } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchPrompts,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: checkAdminRole,
  });

  return { prompts, isLoading, error, isAdmin };
};
