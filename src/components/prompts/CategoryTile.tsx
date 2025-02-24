
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryTileProps {
  title: string;
  description: string;
  iconName: string;
  onClick: () => void;
  className?: string;
}

export function CategoryTile({ title, description, iconName, onClick, className }: CategoryTileProps) {
  const Icon = LucideIcons[iconName as keyof typeof LucideIcons];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-start space-x-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold group-hover:text-purple-600 transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </div>
          {Icon && (
            <Icon className="w-8 h-8 text-muted-foreground group-hover:text-purple-600 transition-colors" />
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
