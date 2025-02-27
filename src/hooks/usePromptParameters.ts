
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

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
  console.log('[Parameters] Fetching parameters...');
  const { data, error } = await supabase
    .from("prompt_parameters")
    .select("*")
    .eq('active', true)  // Only fetch active parameters
    .order("type");

  if (error) {
    console.error('[Parameters] Error fetching:', error);
    throw error;
  }
  console.log('[Parameters] Fetch success:', data);
  return data;
};

const fetchTweaks = async (promptId?: string) => {
  console.log('[Tweaks] Fetching tweaks for prompt:', promptId);
  if (!promptId) {
    const { data, error } = await supabase
      .from("parameter_tweaks")
      .select("*")
      .eq('active', true);  // Only fetch active tweaks

    if (error) {
      console.error('[Tweaks] Error fetching:', error);
      throw error;
    }
    console.log('[Tweaks] Fetch success:', data);
    return data;
  }

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
    .eq('active', true)  // Only fetch active tweaks
    .eq('prompt_parameter_enabled_tweaks.prompt_id', promptId)
    .eq('prompt_parameter_enabled_tweaks.is_enabled', true);

  if (error) {
    console.error('[Tweaks] Error fetching enabled tweaks:', error);
    throw error;
  }
  console.log('[Tweaks] Fetch enabled tweaks success:', data);
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
    console.log('[Realtime] Setting up parameters subscription...');
    
    const parametersChannel = supabase
      .channel('prompt_parameters_changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'prompt_parameters'
        },
        (payload: RealtimePostgresChangesPayload<{old: PromptParameter}>) => {
          console.log('[Realtime] Full DELETE payload:', payload);
          console.log('[Realtime] Payload type:', typeof payload);
          console.log('[Realtime] Old record:', payload.old);
          console.log('[Realtime] Old record type:', typeof payload.old);
          console.log('[Realtime] Is payload.old null?', payload.old === null);
          console.log('[Realtime] Does old have id?', 'id' in (payload.old || {}));

          if (payload.old && 'id' in payload.old) {
            console.log('[Realtime] Deleted parameter ID:', payload.old.id);
          } else {
            console.log('[Realtime] Could not find id in payload:', payload);
          }
          refetchParameters();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prompt_parameters'
        },
        (payload) => {
          console.log('[Realtime] Parameter UPDATE detected:', payload);
          refetchParameters();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prompt_parameters'
        },
        (payload) => {
          console.log('[Realtime] Parameter INSERT detected:', payload);
          refetchParameters();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Parameters subscription status:', status);
      });

    console.log('[Realtime] Setting up tweaks subscription...');
    
    const tweaksChannel = supabase
      .channel('parameter_tweaks_changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'parameter_tweaks'
        },
        (payload: RealtimePostgresChangesPayload<{old: ParameterTweak}>) => {
          console.log('[Realtime] Tweak DELETE detected:', payload);
          refetchTweaks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parameter_tweaks'
        },
        (payload) => {
          console.log('[Realtime] Tweak UPDATE detected:', payload);
          refetchTweaks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parameter_tweaks'
        },
        (payload) => {
          console.log('[Realtime] Tweak INSERT detected:', payload);
          refetchTweaks();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Tweaks subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Cleaning up subscriptions...');
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
