
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, Copy, Trash2, Wand2 } from "lucide-react";
import { type Prompt } from "@/hooks/usePrompts";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  prompt: Prompt;
  isAdmin: boolean;
  onCustomize: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const PromptCard = ({
  prompt,
  isAdmin,
  onCustomize,
  onCopy,
  onDelete,
}: PromptCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="group relative transition-all">
      <CardHeader className="space-y-1 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{prompt.title}</CardTitle>
            <CardDescription className="mt-1 text-xs">
              {prompt.category}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCustomize();
              }}
              className="h-8 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <Wand2 className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="h-8 border-blue-200 hover:border-blue-300 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 text-destructive hover:text-destructive/90"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 flex items-center justify-center hover:bg-muted"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent
        className={cn(
          "p-4 pt-0 space-y-2 overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96" : "max-h-0 p-0"
        )}
      >
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Description:</p>
          <p className="mb-2">{prompt.description}</p>
          <p className="font-medium text-foreground">Prompt:</p>
          <p className="whitespace-pre-wrap">{prompt.prompt}</p>
        </div>
      </CardContent>
    </Card>
  );
};
