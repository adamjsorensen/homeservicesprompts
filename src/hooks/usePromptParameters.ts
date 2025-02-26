
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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

const fetchTweaks = async (promptId?: string) => {
  if (!promptId) {
    const { data, error } = await supabase
      .from("parameter_tweaks")
      .select("*");

    if (error) throw error;
    return data;
  }

  // Fetch only enabled tweaks for this prompt
  const { data, error } = await supabase
    .from("parameter_tweaks")
    .select(`
      *,
      prompt_parameter_enabled_tweaks!inner(
        prompt_id,
        parameter_id,
        is_enabled
      )
    `)
    .eq('prompt_parameter_enabled_tweaks.prompt_id', promptId)
    .eq('prompt_parameter_enabled_tweaks.is_enabled', true);

  if (error) throw error;
  return data;
};

export const usePromptParameters = (promptId?: string) => {
  const { 
    data: parameters = [], 
    isLoading: isLoadingParameters,
    refetch: refetchParameters 
  } = useQuery({
    queryKey: ["prompt_parameters"],
    queryFn: fetchParameters,
  });

  const { 
    data: tweaks = [], 
    isLoading: isLoadingTweaks,
    refetch: refetchTweaks 
  } = useQuery({
    queryKey: ["parameter_tweaks", promptId],
    queryFn: () => fetchTweaks(promptId),
  });

  useEffect(() => {
    // Subscribe to changes in prompt_parameters table
    const parametersChannel = supabase
      .channel('prompt_parameters_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompt_parameters'
        },
        () => {
          console.log('Parameters changed, refetching...');
          refetchParameters();
        }
      )
      .subscribe();

    // Subscribe to changes in parameter_tweaks table
    const tweaksChannel = supabase
      .channel('parameter_tweaks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parameter_tweaks'
        },
        () => {
          console.log('Tweaks changed, refetching...');
          refetchTweaks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(parametersChannel);
      supabase.removeChannel(tweaksChannel);
    };
  }, [refetchParameters, refetchTweaks]);

  const getTweaksForParameter = (parameterId: string | null) => {
    if (!parameterId) return tweaks;
    return tweaks.filter(tweak => tweak.parameter_id === parameterId);
  };

  const getParametersByType = (type: string | null) => {
    if (!type) return parameters;
    return parameters.filter(param => param.type === type);
  };

  return {
    parameters,
    tweaks,
    getTweaksForParameter,
    getParametersByType,
    isLoading: isLoadingParameters || isLoadingTweaks,
  };
};
