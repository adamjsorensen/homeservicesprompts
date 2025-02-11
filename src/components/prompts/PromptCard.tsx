
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Trash2, Wand2 } from "lucide-react";
import { type Prompt } from "@/hooks/usePrompts";

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
  return (
    <Card className="group relative">
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
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCustomize();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Customize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="border-blue-200 hover:border-blue-300 transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive hover:text-destructive/90"
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
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {prompt.prompt}
        </p>
      </CardContent>
    </Card>
  );
};
