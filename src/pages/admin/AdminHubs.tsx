
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";

const AdminHubs = () => {
  const { prompts } = usePrompts();
  
  // Group prompts by hub area
  const hubAreas = [...new Set(prompts.map(prompt => prompt.hub_area))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hub Management</h1>
          <p className="text-muted-foreground">
            Organize and manage your prompt hubs
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Hub
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubAreas.map((hubArea) => (
          <div
            key={hubArea}
            className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">{hubArea}</h3>
            <p className="text-sm text-muted-foreground">
              {prompts.filter(p => p.hub_area === hubArea).length} prompts
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHubs;
