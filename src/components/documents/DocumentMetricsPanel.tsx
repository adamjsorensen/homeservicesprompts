
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import { DocumentMetrics } from '@/types/documentTypes';

interface DocumentMetricsPanelProps {
  documentId: string;
}

export default function DocumentMetricsPanel({ documentId }: DocumentMetricsPanelProps) {
  const [metrics, setMetrics] = useState<DocumentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First get document data including chunk count
        const { data: document, error: documentError } = await supabase
          .from('documents')
          .select('title, metadata, file_type, created_at')
          .eq('id', documentId)
          .single();

        if (documentError) throw new Error(documentError.message);

        // Count document chunks separately
        const { count: chunksCount, error: chunksError } = await supabase
          .from('document_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', documentId);

        if (chunksError) throw new Error(chunksError.message);

        // Query for retrieval metrics from usage logs
        const retrievalStats = {
          retrievalCount: 0,
          avgSimilarity: 0,
          maxSimilarity: 0,
          minSimilarity: 0,
          usageByDay: []
        };

        // Since the table was just created, we'll provide default metrics for now
        // Later we can query the response_quality_metrics table

        const metrics: DocumentMetrics = {
          retrievalCount: retrievalStats.retrievalCount,
          avgSimilarity: retrievalStats.avgSimilarity,
          maxSimilarity: retrievalStats.maxSimilarity,
          minSimilarity: retrievalStats.minSimilarity,
          usageByDay: retrievalStats.usageByDay,
          chunksCount: chunksCount || 0,
          metadata: document?.metadata || {}
        };

        setMetrics(metrics);
      } catch (err) {
        console.error('Error fetching document metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchMetrics();
    }
  }, [documentId]);

  if (loading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <ReloadIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load document metrics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <CardDescription>No metrics available</CardDescription>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = metrics.usageByDay.map(day => ({
    date: day.date,
    count: day.count
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Performance</CardTitle>
        <CardDescription>
          Usage statistics and retrieval performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Chunks</span>
            <span className="text-2xl font-bold">{metrics.chunksCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Retrievals</span>
            <span className="text-2xl font-bold">{metrics.retrievalCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Avg. Similarity</span>
            <span className="text-2xl font-bold">{metrics.avgSimilarity.toFixed(2)}</span>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] w-full flex items-center justify-center">
            <CardDescription>No usage data available yet</CardDescription>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Metrics updated at {new Date().toLocaleString()}
      </CardFooter>
    </Card>
  );
}
