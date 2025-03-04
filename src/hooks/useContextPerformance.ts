
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface PerformanceMetricSummary {
  averageDuration: number
  cacheHitRate: number
  errorRate: number
  totalQueries: number
  responseGenerationAvg: number
  byHubArea: Record<string, {
    averageDuration: number
    cacheHitRate: number
    count: number
  }>
  timeframe: string
}

export interface QualityMetricSummary {
  avgSimilarity: number
  avgResultCount: number
  byHubArea: Record<string, {
    avgSimilarity: number
    avgResultCount: number
    count: number
  }>
  timeframe: string
}

export function useContextPerformance(timeframe: 'day' | 'week' | 'month' = 'week') {
  const getPerformanceMetrics = async (): Promise<PerformanceMetricSummary> => {
    const timeInterval = 
      timeframe === 'day' ? '1 day' :
      timeframe === 'week' ? '7 days' : '30 days';
      
    const { data: perfData, error: perfError } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', `now() - interval '${timeInterval}'`);
      
    if (perfError) throw perfError;
    
    const contextQueries = perfData.filter(m => m.operation_type === 'context_retrieval');
    const responseGeneration = perfData.filter(m => m.operation_type === 'response_generation');
    
    // Calculate average metrics
    const totalQueries = contextQueries.length;
    const cacheHits = contextQueries.filter(m => m.cache_hit).length;
    const errors = contextQueries.filter(m => m.status === 'error').length;
    const totalDuration = contextQueries.reduce((sum, m) => sum + m.duration_ms, 0);
    
    // Group by hub area
    const hubAreas: Record<string, any[]> = {};
    contextQueries.forEach(metric => {
      const hubArea = metric.hub_area || 'unknown';
      if (!hubAreas[hubArea]) hubAreas[hubArea] = [];
      hubAreas[hubArea].push(metric);
    });
    
    // Calculate by hub area
    const byHubArea: Record<string, any> = {};
    Object.entries(hubAreas).forEach(([hub, metrics]) => {
      const hubCacheHits = metrics.filter(m => m.cache_hit).length;
      const hubTotalDuration = metrics.reduce((sum, m) => sum + m.duration_ms, 0);
      byHubArea[hub] = {
        averageDuration: metrics.length ? hubTotalDuration / metrics.length : 0,
        cacheHitRate: metrics.length ? hubCacheHits / metrics.length : 0,
        count: metrics.length
      };
    });
    
    return {
      averageDuration: totalQueries ? totalDuration / totalQueries : 0,
      cacheHitRate: totalQueries ? cacheHits / totalQueries : 0,
      errorRate: totalQueries ? errors / totalQueries : 0,
      totalQueries,
      responseGenerationAvg: responseGeneration.length ? 
        responseGeneration.reduce((sum, m) => sum + m.duration_ms, 0) / responseGeneration.length : 0,
      byHubArea,
      timeframe
    };
  };
  
  const getQualityMetrics = async (): Promise<QualityMetricSummary> => {
    const timeInterval = 
      timeframe === 'day' ? '1 day' :
      timeframe === 'week' ? '7 days' : '30 days';
      
    const { data: qualityData, error: qualityError } = await supabase
      .from('retrieval_quality_metrics')
      .select('*')
      .gte('created_at', `now() - interval '${timeInterval}'`);
      
    if (qualityError) throw qualityError;
    
    // Calculate averages
    const totalMetrics = qualityData.length;
    const totalSimilarity = qualityData.reduce((sum, m) => sum + m.avg_similarity, 0);
    const totalResults = qualityData.reduce((sum, m) => sum + m.total_results, 0);
    
    // Group by hub area
    const hubAreas: Record<string, any[]> = {};
    qualityData.forEach(metric => {
      const hubArea = metric.hub_area || 'unknown';
      if (!hubAreas[hubArea]) hubAreas[hubArea] = [];
      hubAreas[hubArea].push(metric);
    });
    
    // Calculate by hub area
    const byHubArea: Record<string, any> = {};
    Object.entries(hubAreas).forEach(([hub, metrics]) => {
      const hubTotalSimilarity = metrics.reduce((sum, m) => sum + m.avg_similarity, 0);
      const hubTotalResults = metrics.reduce((sum, m) => sum + m.total_results, 0);
      byHubArea[hub] = {
        avgSimilarity: metrics.length ? hubTotalSimilarity / metrics.length : 0,
        avgResultCount: metrics.length ? hubTotalResults / metrics.length : 0,
        count: metrics.length
      };
    });
    
    return {
      avgSimilarity: totalMetrics ? totalSimilarity / totalMetrics : 0,
      avgResultCount: totalMetrics ? totalResults / totalMetrics : 0,
      byHubArea,
      timeframe
    };
  };
  
  const performanceQuery = useQuery({
    queryKey: ['contextPerformance', timeframe],
    queryFn: getPerformanceMetrics
  });
  
  const qualityQuery = useQuery({
    queryKey: ['contextQuality', timeframe],
    queryFn: getQualityMetrics
  });
  
  return {
    performanceMetrics: performanceQuery.data,
    qualityMetrics: qualityQuery.data,
    isLoading: performanceQuery.isLoading || qualityQuery.isLoading,
    error: performanceQuery.error || qualityQuery.error,
    refetch: () => {
      performanceQuery.refetch();
      qualityQuery.refetch();
    }
  };
}
