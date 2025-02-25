
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePromptParameters } from "@/hooks/usePromptParameters";
import { PARAMETER_TYPES } from "@/constants/parameterTypes";

const AdminParameters = () => {
  const { parameters } = usePromptParameters();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parameter System</h1>
          <p className="text-muted-foreground">
            Configure parameters and tweaks for prompts
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PARAMETER_TYPES.map((type) => {
          const typeParameters = parameters.filter(p => p.type === type);
          return (
            <div
              key={type}
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                {type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {typeParameters.length} parameters
              </p>
              <div className="space-y-2">
                {typeParameters.map((param) => (
                  <div key={param.id} className="text-sm">
                    {param.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminParameters;
