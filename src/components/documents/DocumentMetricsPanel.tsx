
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/badge'

interface DocumentMetrics {
  retrievalCount: number;
  avgSimilarity: number;
  maxSimilarity: number;
  minSimilarity: number;
  usageByDay: Array<{
    date: string;
    count: number;
  }>;
}

interface DocumentMetricsPanelProps {
  documentId: string;
}

export function DocumentMetricsPanel({ documentId }: DocumentMetricsPanelProps) {
  const [metrics, setMetrics] = useState<DocumentMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        // Fetch retrieval quality metrics
        const { data: qualityData, error: qualityError } = await supabase
          .from('retrieval_quality_metric')
          .select('avg_similarity, min_similarity, max_similarity')
          .eq('document_id', documentId)
        
        if (qualityError) throw qualityError

        // Calculate usage by day for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: usageData, error: usageError } = await supabase
          .from('performance_metrics')
          .select('created_at')
          .eq('document_id', documentId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: true })

        if (usageError) throw usageError

        // Process usage data by day
        const usageByDay = processUsageByDay(usageData || [])

        // Calculate aggregated metrics
        const avgSimilarity = qualityData && qualityData.length > 0
          ? qualityData.reduce((sum, item) => sum + (item.avg_similarity || 0), 0) / qualityData.length
          : 0

        const maxSimilarity = qualityData && qualityData.length > 0
          ? Math.max(...qualityData.map(item => item.max_similarity || 0))
          : 0

        const minSimilarity = qualityData && qualityData.length > 0
          ? Math.min(...qualityData.map(item => item.min_similarity || 0).filter(val => val > 0))
          : 0

        setMetrics({
          retrievalCount: usageData?.length || 0,
          avgSimilarity,
          maxSimilarity,
          minSimilarity,
          usageByDay
        })
      } catch (error) {
        console.error('Error fetching document metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [documentId])

  // Process usage data into daily counts
  const processUsageByDay = (usageData: any[]) => {
    const dayMap = new Map<string, number>()
    
    usageData.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      dayMap.set(date, (dayMap.get(date) || 0) + 1)
    })
    
    // Convert to array and sort by date
    return Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // Generate quality score label
  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return { label: 'Excellent', variant: 'default' }
    if (score >= 0.6) return { label: 'Good', variant: 'secondary' }
    if (score >= 0.4) return { label: 'Average', variant: 'outline' }
    return { label: 'Poor', variant: 'destructive' }
  }

  const qualityInfo = metrics ? getQualityLabel(metrics.avgSimilarity) : { label: 'Unknown', variant: 'outline' }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Document Performance Metrics</CardTitle>
        <CardDescription>
          Usage statistics and performance data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading metrics...</p>
          </div>
        ) : !metrics ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No metrics available</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs font-medium">Retrieval Count</div>
                <div className="text-2xl font-bold">{metrics.retrievalCount}</div>
              </div>
              
              <div className="rounded-lg border p-3">
                <div className="text-xs font-medium">Quality Score</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {metrics.avgSimilarity.toFixed(2)}
                  </div>
                  <Badge variant={qualityInfo.variant as any}>
                    {qualityInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Usage Trend (30 days)</h4>
              <div className="h-[180px] w-full">
                {metrics.usageByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.usageByDay}>
                      <XAxis 
                        dataKey="date" 
                        fontSize={10}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return `${date.getMonth()+1}/${date.getDate()}`
                        }}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Similarity Metrics</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-muted p-2">
                  <div className="text-xs text-muted-foreground">Min</div>
                  <div className="font-medium">{metrics.minSimilarity.toFixed(2)}</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="text-xs text-muted-foreground">Avg</div>
                  <div className="font-medium">{metrics.avgSimilarity.toFixed(2)}</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="text-xs text-muted-foreground">Max</div>
                  <div className="font-medium">{metrics.maxSimilarity.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
