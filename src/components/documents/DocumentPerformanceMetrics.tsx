
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
  Server,
  Activity,
  Cpu,
  DollarSign,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface DocumentPerformanceMetricsProps {
  metrics: PerformanceMetrics | null
  className?: string
  showDetailed?: boolean
}

export function DocumentPerformanceMetrics({ 
  metrics, 
  className,
  showDetailed = false
}: DocumentPerformanceMetricsProps) {
  if (!metrics) return null
  
  const { durationMs, cacheHit, status, qualityMetrics, batches, generationDurationMs, resourceUsage } = metrics
  
  const getBadgeVariant = () => {
    if (status === 'error') return 'destructive'
    if (durationMs < 500) return 'default'
    if (durationMs < 1000) return 'secondary'
    return 'outline'
  }
  
  const formatCost = (cost?: number) => {
    if (!cost) return '−';
    return `$${cost.toFixed(5)}`;
  }
  
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className={`inline-flex items-center gap-1 cursor-help`}>
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
            {status && (
              <Badge variant={status === 'error' ? 'destructive' : 'outline'}>
                {status === 'error' ? (
                  <AlertCircle className="h-3 w-3 mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {status}
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
                <span className="text-muted-foreground">Retrieval:</span>
              </div>
              <div>{durationMs}ms</div>
              
              {generationDurationMs && (
                <>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Generation:</span>
                  </div>
                  <div>{generationDurationMs}ms</div>
                </>
              )}
              
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
              
              {resourceUsage && (
                <>
                  {resourceUsage.tokens !== undefined && (
                    <>
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Tokens:</span>
                      </div>
                      <div>{resourceUsage.tokens}</div>
                    </>
                  )}
                  
                  {(resourceUsage.embeddingCost !== undefined || resourceUsage.generationCost !== undefined) && (
                    <>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Cost:</span>
                      </div>
                      <div>
                        {resourceUsage.embeddingCost !== undefined && (
                          <span className="mr-2">
                            E: {formatCost(resourceUsage.embeddingCost)}
                          </span>
                        )}
                        {resourceUsage.generationCost !== undefined && (
                          <span>
                            G: {formatCost(resourceUsage.generationCost)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
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
      
      {showDetailed && (
        <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-muted rounded-md">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Retrieval Time:</span>
          </div>
          <div>{durationMs}ms</div>
          
          {generationDurationMs && (
            <>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>Generation Time:</span>
              </div>
              <div>{generationDurationMs}ms</div>
            </>
          )}
          
          {qualityMetrics && (
            <>
              <div className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                <span>Avg Similarity:</span>
              </div>
              <div>{(qualityMetrics.avgSimilarity * 100).toFixed(1)}%</div>
            </>
          )}
          
          {resourceUsage?.tokens !== undefined && (
            <>
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>Tokens:</span>
              </div>
              <div>{resourceUsage.tokens}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
