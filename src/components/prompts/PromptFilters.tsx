
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

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
