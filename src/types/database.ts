
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
