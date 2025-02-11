
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

interface PromptFiltersProps {
  filter: string;
  searchQuery: string;
  onFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export const PromptFilters = ({
  filter,
  searchQuery,
  onFilterChange,
  onSearchChange,
}: PromptFiltersProps) => {
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
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
            <SelectItem value="content">Content</SelectItem>
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
