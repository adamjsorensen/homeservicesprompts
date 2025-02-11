
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { data, error } = await supabase
    .from('prompts')
    .select('category')
    .eq('is_default', true);

  if (error) throw error;

  // Get unique categories and sort them
  const categories = data.map(item => item.category as string);
  const uniqueCategories = Array.from(new Set(categories))
    .sort((a, b) => a.localeCompare(b));

  return uniqueCategories;
};

export const PromptFilters = ({
  filter,
  searchQuery,
  onFilterChange,
  onSearchChange,
}: PromptFiltersProps) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["promptCategories"],
    queryFn: fetchUniqueCategories,
  });

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category.toLowerCase()}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prompts..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
