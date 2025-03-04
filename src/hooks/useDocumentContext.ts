
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DocumentContext {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
  citation_context: string;
  relevance_score: number;
  hub_areas: string[];
}

export interface ContextResults {
  results: DocumentContext[];
  source: 'cache' | 'live_query';
}

export interface UseDocumentContextProps {
  similarityThreshold?: number;
  matchCount?: number;
  useCached?: boolean;
}

export function useDocumentContext(props?: UseDocumentContextProps) {
  const {
    similarityThreshold = 0.7,
    matchCount = 5,
    useCached = true
  } = props || {};

  const [isLoading, setIsLoading] = useState(false);
  const [contextResults, setContextResults] = useState<DocumentContext[]>([]);
  const [resultSource, setResultSource] = useState<'cache' | 'live_query' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const retrieveContext = async (query: string, hubArea?: string) => {
    if (!query.trim()) {
      setContextResults([]);
      setResultSource(null);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('retrieve-document-context', {
        body: {
          query,
          hubArea,
          similarityThreshold,
          matchCount,
          useCached
        },
      });

      if (error) {
        throw new Error(`Error retrieving context: ${error.message}`);
      }

      const typedData = data as ContextResults;
      setContextResults(typedData.results);
      setResultSource(typedData.source);
      
      return typedData.results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error retrieving context",
        description: errorMessage,
      });
      setContextResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponseWithContext = async (
    prompt: string, 
    context: DocumentContext[] = contextResults,
    systemPrompt?: string,
    customPromptId?: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-response-with-context', {
        body: {
          prompt,
          contextChunks: context,
          systemPrompt,
          customPromptId,
          saveReferences: !!customPromptId
        },
      });

      if (error) {
        throw new Error(`Error generating response: ${error.message}`);
      }

      return {
        generatedContent: data.generated_content,
        generationId: data.generation_id
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        variant: "destructive",
        title: "Error generating response",
        description: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    contextResults,
    resultSource,
    error,
    retrieveContext,
    generateResponseWithContext
  };
}
