
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchProcessingStatus } from '@/types/database';

export function useBatchProcessing() {
  // Fetch a batch by ID
  const getBatchStatus = async (batchId: string): Promise<BatchProcessingStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('batch_id', batchId)
        .single();
        
      if (error) throw error;
      return data as BatchProcessingStatus;
    } catch (err) {
      console.error('Error fetching batch status:', err);
      return null;
    }
  };

  // Poll for batch status updates
  const useBatchStatusPolling = (batchId: string | null, enabled = true, interval = 5000) => {
    return useQuery({
      queryKey: ['batchStatus', batchId],
      queryFn: () => getBatchStatus(batchId!),
      enabled: !!batchId && enabled,
      refetchInterval: interval,
      refetchIntervalInBackground: true,
    });
  };

  // Create a new batch
  const createBatch = async (metadata: Record<string, any> = {}): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('batch_processing_status')
        .insert({
          status: 'created',
          metadata,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data.batch_id;
    } catch (err) {
      console.error('Error creating batch:', err);
      return null;
    }
  };

  // Update batch status
  const updateBatchStatus = async (
    batchId: string,
    updates: Partial<BatchProcessingStatus>
  ): Promise<BatchProcessingStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('batch_processing_status')
        .update(updates)
        .eq('batch_id', batchId)
        .select()
        .single();
        
      if (error) throw error;
      return data as BatchProcessingStatus;
    } catch (err) {
      console.error('Error updating batch status:', err);
      return null;
    }
  };

  return {
    getBatchStatus: useMutation({
      mutationFn: getBatchStatus,
    }),
    useBatchStatusPolling,
    createBatch: useMutation({
      mutationFn: createBatch,
    }),
    updateBatchStatus: useMutation({
      mutationFn: updateBatchStatus,
    }),
  };
}
