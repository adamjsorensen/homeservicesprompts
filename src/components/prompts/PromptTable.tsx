
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Wand2 } from "lucide-react";
import { type Prompt } from "@/hooks/usePrompts";

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
            <TableHead>Description</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell className="font-medium">{prompt.title}</TableCell>
              <TableCell>{prompt.category}</TableCell>
              <TableCell className="whitespace-pre-wrap">
                {prompt.description}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onCustomize(prompt)}
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    <Wand2 className="w-3 h-3 mr-2" />
                    Customize
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
