
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { QueryAnalysis, QueryContext, StructuredResponse } from '@/types/queryTypes';

export function useEnhancedQuery() {
  const { user } = useAuth();
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [context, setContext] = useState<QueryContext | null>(null);

  const analyzeQuery = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-query', {
        body: { query }
      });
      
      if (error) throw error;
      return data as QueryAnalysis;
    }
  });

  const retrieveContext = useMutation({
    mutationFn: async ({ 
      query, 
      hubArea, 
      filters 
    }: { 
      query: string; 
      hubArea?: string; 
      filters?: Record<string, any>; 
    }) => {
      const { data, error } = await supabase.functions.invoke('enhanced-retrieve-context', {
        body: { 
          query,
          hubArea,
          filters,
          userId: user?.id
        }
      });
      
      if (error) throw error;
      setContext(data);
      return data as QueryContext;
    }
  });

  const generateResponse = useMutation({
    mutationFn: async ({ 
      query, 
      context,
      outputFormat = 'json'
    }: { 
      query: string; 
      context: QueryContext;
      outputFormat?: 'json' | 'markdown' | 'html';
    }) => {
      const { data, error } = await supabase.functions.invoke('enhanced-generate-response', {
        body: { 
          query,
          context,
          outputFormat,
          userId: user?.id,
          queryHistory
        }
      });
      
      if (error) throw error;
      setQueryHistory(prev => [...prev, query]);
      return data as StructuredResponse;
    }
  });

  return {
    analyzeQuery,
    retrieveContext,
    generateResponse,
    context,
    queryHistory
  };
}
