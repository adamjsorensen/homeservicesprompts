
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Plus } from "lucide-react";

interface PromptFiltersProps {
  filter: string;
  onFilterChange: (value: string) => void;
  onCreateClick: () => void;
}

export const PromptFilters = ({
  filter,
  onFilterChange,
  onCreateClick,
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
          </SelectContent>
        </Select>
      </div>
      <Input
        placeholder="Search prompts..."
        className="w-[200px] md:w-[300px]"
      />
      <Button onClick={onCreateClick}>
        <Plus className="w-4 h-4 mr-2" />
        Create Prompt
      </Button>
    </div>
  );
};
