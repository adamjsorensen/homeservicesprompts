
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export function LoadingCard() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating Content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            AI is crafting your custom content. This may take a few moments...
          </p>
          <div className="animate-pulse space-y-3">
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-2 bg-muted rounded w-5/6"></div>
            <div className="h-2 bg-muted rounded w-4/6"></div>
          </div>
        </div>
        <Progress value={66} className="h-2" />
      </CardContent>
    </Card>
  );
}
