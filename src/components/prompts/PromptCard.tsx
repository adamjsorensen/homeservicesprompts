
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, Copy, Trash2 } from "lucide-react";
import { type Prompt } from "@/hooks/usePrompts";

interface PromptCardProps {
  prompt: Prompt;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const PromptCard = ({
  prompt,
  isAdmin,
  isExpanded,
  onToggle,
  onCopy,
  onDelete,
}: PromptCardProps) => {
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 ${
        isExpanded ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onToggle}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{prompt.title}</CardTitle>
            <CardDescription className="mt-2">
              {prompt.description}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-muted-foreground">
            {prompt.category}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>
      <CardContent
        className={`grid transition-all duration-200 ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {prompt.prompt}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
