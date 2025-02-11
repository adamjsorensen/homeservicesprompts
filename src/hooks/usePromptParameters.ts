
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PromptParameter {
  id: string;
  type: string;
  name: string;
  description: string | null;
}

export interface ParameterTweak {
  id: string;
  parameter_id: string | null;
  name: string;
  sub_prompt: string;
}

const fetchParameters = async () => {
  const { data, error } = await supabase
    .from("prompt_parameters")
    .select("*")
    .order("type");

  if (error) throw error;
  return data;
};

const fetchTweaks = async () => {
  const { data, error } = await supabase
    .from("parameter_tweaks")
    .select("*");

  if (error) throw error;
  return data;
};

export const usePromptParameters = () => {
  const { data: parameters = [], isLoading: isLoadingParameters } = useQuery({
    queryKey: ["prompt_parameters"],
    queryFn: fetchParameters,
  });

  const { data: tweaks = [], isLoading: isLoadingTweaks } = useQuery({
    queryKey: ["parameter_tweaks"],
    queryFn: fetchTweaks,
  });

  const getTweaksForParameter = (parameterId: string) => {
    return tweaks.filter(tweak => tweak.parameter_id === parameterId);
  };

  return {
    parameters,
    tweaks,
    getTweaksForParameter,
    isLoading: isLoadingParameters || isLoadingTweaks,
  };
};
