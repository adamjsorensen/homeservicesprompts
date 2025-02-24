import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
interface PromptFiltersProps {
  filter: string;
  searchQuery: string;
  onFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}
const fetchUniqueCategories = async () => {
  const {
    data,
    error
  } = await supabase.from('prompts').select('category').order('category', {
    ascending: true
  });
  if (error) throw error;

  // Get unique categories and sort them
  const categories = data.map(item => item.category);
  const uniqueCategories = Array.from(new Set(categories));
  return uniqueCategories;
};
export const PromptFilters = ({
  filter,
  searchQuery,
  onFilterChange,
  onSearchChange
}: PromptFiltersProps) => {
  const {
    data: categories = [],
    isLoading
  } = useQuery({
    queryKey: ["promptCategories"],
    queryFn: fetchUniqueCategories
  });
  return;
};