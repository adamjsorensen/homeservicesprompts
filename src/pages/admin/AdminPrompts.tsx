
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";

const AdminPrompts = () => {
  const { prompts } = usePrompts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Creation</h1>
          <p className="text-muted-foreground">
            Create and manage your prompts
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">{prompt.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {prompt.description}
            </p>
            <div className="text-xs text-muted-foreground">
              Category: {prompt.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPrompts;
