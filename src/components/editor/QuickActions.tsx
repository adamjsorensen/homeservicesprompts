
import { Button } from "@/components/ui/button";

interface QuickActionProps {
  onActionClick: (action: string) => void;
  isLoading: boolean;
}

export function QuickActions({ onActionClick, isLoading }: QuickActionProps) {
  const actions = [
    "Make shorter",
    "Make longer",
    "More formal",
    "More casual",
    "More persuasive",
    "Add bullet points"
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300">
      {actions.map((action) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          onClick={() => onActionClick(action)}
          disabled={isLoading}
          className="whitespace-nowrap"
        >
          {action}
        </Button>
      ))}
    </div>
  );
}
