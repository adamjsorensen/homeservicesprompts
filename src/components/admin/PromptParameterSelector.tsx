
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePromptParameters } from "@/hooks/usePromptParameters";

interface PromptParameterSelectorProps {
  onParameterToggle: (parameterId: string, enabled: boolean) => void;
  onTweakToggle: (parameterId: string, tweakId: string, enabled: boolean) => void;
  selectedParameters: Set<string>;
  enabledTweaks: Record<string, Set<string>>;
}

export function PromptParameterSelector({
  onParameterToggle,
  onTweakToggle,
  selectedParameters,
  enabledTweaks,
}: PromptParameterSelectorProps) {
  const { parameters, tweaks } = usePromptParameters();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredParameters = parameters.filter(param =>
    param.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEnabledTweakCount = (parameterId: string) => {
    const parameterTweaks = tweaks.filter(t => t.parameter_id === parameterId);
    const enabledCount = enabledTweaks[parameterId]?.size ?? 0;
    return `${enabledCount}/${parameterTweaks.length} tweaks enabled`;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parameters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {filteredParameters.map((param) => (
            <div
              key={param.id}
              className={`rounded-lg border p-4 transition-colors ${
                selectedParameters.has(param.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={param.id}
                    checked={selectedParameters.has(param.id)}
                    onCheckedChange={(checked) =>
                      onParameterToggle(param.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={param.id} className="font-medium">
                    {param.name}
                  </Label>
                </div>
                {selectedParameters.has(param.id) && (
                  <Badge variant="secondary">
                    {getEnabledTweakCount(param.id)}
                  </Badge>
                )}
              </div>

              {selectedParameters.has(param.id) && (
                <div className="ml-6 mt-2 space-y-2">
                  {tweaks
                    .filter((tweak) => tweak.parameter_id === param.id)
                    .map((tweak) => (
                      <div
                        key={tweak.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`tweak-${tweak.id}`}
                          checked={enabledTweaks[param.id]?.has(tweak.id) ?? false}
                          onCheckedChange={(checked) =>
                            onTweakToggle(param.id, tweak.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`tweak-${tweak.id}`}
                          className="text-sm"
                        >
                          {tweak.name}
                        </Label>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
