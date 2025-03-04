
import { PerformanceMetrics } from '@/hooks/useDocumentContext'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock,
  Gauge,
  Zap,
  BarChart,
  Percent,
  Server
} from "lucide-react"

interface DocumentPerformanceMetricsProps {
  metrics: PerformanceMetrics | null
  className?: string
}

export function DocumentPerformanceMetrics({ 
  metrics, 
  className 
}: DocumentPerformanceMetricsProps) {
  if (!metrics) return null
  
  const { durationMs, cacheHit, status, qualityMetrics, batches } = metrics
  
  const getBadgeVariant = () => {
    if (status === 'error') return 'destructive'
    if (durationMs < 500) return 'default'
    if (durationMs < 1000) return 'secondary'
    return 'outline'
  }
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className={`inline-flex items-center gap-1 cursor-help ${className}`}>
          <Badge variant={getBadgeVariant()}>
            <Clock className="h-3 w-3 mr-1" />
            {durationMs}ms
          </Badge>
          {cacheHit && (
            <Badge variant="outline">
              <Zap className="h-3 w-3 mr-1 text-yellow-500" />
              Cache
            </Badge>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Performance Metrics</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
            </div>
            <div>{durationMs}ms</div>
            
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Cache Hit:</span>
            </div>
            <div>{cacheHit ? 'Yes' : 'No'}</div>
            
            {batches !== undefined && (
              <>
                <div className="flex items-center gap-1">
                  <Server className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Batches:</span>
                </div>
                <div>{batches}</div>
              </>
            )}
            
            {qualityMetrics && (
              <>
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Avg Similarity:</span>
                </div>
                <div>{(qualityMetrics.avgSimilarity * 100).toFixed(1)}%</div>
                
                <div className="flex items-center gap-1">
                  <Percent className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Similarity Range:</span>
                </div>
                <div>
                  {(qualityMetrics.minSimilarity * 100).toFixed(1)}% - 
                  {(qualityMetrics.maxSimilarity * 100).toFixed(1)}%
                </div>
              </>
            )}
            
            <div className="flex items-center gap-1">
              <BarChart className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Status:</span>
            </div>
            <div className={status === 'error' ? 'text-destructive' : 'text-green-500'}>
              {status === 'error' ? 'Error' : 'Success'}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
