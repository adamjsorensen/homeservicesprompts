
export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, any>;
  chunk_index: number;
  similarity?: number;
  relevance_score?: number;
  created_at: string;
  updated_at: string;
  document?: {
    id: string;
    title: string;
    file_type: string;
    hub_areas: string[];
  };
  document_title?: string;
  hub_areas?: string[];
}

export interface NodeRelationship {
  id: string;
  parent_chunk_id: string;
  child_chunk_id: string;
  relationship_type: string;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  changes: Record<string, any>;
  created_at: string;
}

export interface PerformanceMetric {
  id: string;
  operation_id: string;
  operation_type: string;
  user_id?: string;
  duration_ms: number;
  status: string;
  cache_hit: boolean;
  hub_area?: string;
  metadata?: Record<string, any>;
  resource_usage?: Record<string, any>;
  timing_breakdown?: Record<string, any>;
  system_metrics?: Record<string, any>;
  created_at: string;
}

export interface RetrievalQualityMetric {
  id: string;
  operation_id: string;
  query: string;
  avg_similarity: number;
  min_similarity?: number;
  max_similarity?: number;
  total_results: number;
  hub_area?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface BatchProcessingStatus {
  id: string;
  batch_id: string;
  total_items: number;
  processed_items: number;
  status: string;
  error_count: number;
  started_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id?: string;
  role?: string;
  permission_level: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessAuditLog {
  id: string;
  document_id: string;
  user_id?: string;
  action_type: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
