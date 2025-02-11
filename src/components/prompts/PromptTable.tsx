
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Wand2 } from "lucide-react";
import { type Prompt } from "@/hooks/usePrompts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PromptTableProps {
  prompts: Prompt[];
  isAdmin: boolean;
  onCustomize: (prompt: Prompt) => void;
  onCopy: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
}

export const PromptTable = ({
  prompts,
  isAdmin,
  onCustomize,
  onCopy,
  onDelete,
}: PromptTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="max-w-[300px]">Description</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell className="font-medium">{prompt.title}</TableCell>
              <TableCell>{prompt.category}</TableCell>
              <TableCell className="max-w-[300px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate cursor-help">
                        {prompt.description}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-normal">
                        {prompt.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onCustomize(prompt)}
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopy(prompt)}
                    className="h-8 border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(prompt)}
                      className="h-8 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
