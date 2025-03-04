
import { Json } from "@/integrations/supabase/types";

export interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  hub_areas: string[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  embedding?: string | null;
  metadata?: Record<string, any>;
  chunks_count?: number;
  processor?: string;
  graphlit_doc_id?: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  embedding?: any;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  relevance_score?: number;
  parent_chunks?: string[];
  child_chunks?: string[];
  graphlit_chunk_id?: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id?: string | null;
  role?: string | null;
  permission_level: string;
  expires_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentMetrics {
  retrievalCount: number;
  avgSimilarity: number;
  maxSimilarity: number;
  minSimilarity: number;
  usageByDay: Array<{
    date: string;
    count: number;
  }>;
  chunksCount: number;
  metadata: Record<string, any>;
}

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  splitByHeading?: boolean;
  hierarchical?: boolean;
}

export interface GraphlitProcessingResult {
  chunks: Array<{ 
    text: string; 
    metadata: Record<string, any>;
    chunk_id: string;
  }>;
  document_id: string;
  document_metadata: Record<string, any>;
  processing_metadata: Record<string, any>;
}

export type DocumentProcessor = 'custom' | 'graphlit';

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

// Query types for Graphlit integration

export interface QueryHistoryEntry {
  id: string;
  user_id: string;
  query_text: string;
  context_chunks: string[];
  hub_area?: string;
  filters?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClarificationLogEntry {
  id: string;
  query_id: string;
  clarification_type: string;
  original_query: string;
  suggested_questions: string[];
  selected_question?: string;
  created_at: string;
}

export interface ResponseQualityMetrics {
  id: string;
  query_id: string;
  response_id: string;
  relevance_score?: number;
  completeness_score?: number;
  citation_accuracy_score?: number;
  source_diversity_score?: number;
  feedback_type?: string;
  feedback_text?: string;
  created_at: string;
}

export interface SourceValidationResult {
  id: string;
  response_id: string;
  document_id: string;
  chunk_id: string;
  validation_type: string;
  is_valid: boolean;
  confidence_score?: number;
  validation_details?: Record<string, any>;
  created_at: string;
}

export interface EnhancedQueryContext {
  queryId: string;
  relevantChunks: DocumentChunk[];
  sourceDocuments: Document[];
  relationships?: Record<string, string[]>;
  filters?: Record<string, any>;
}

export interface EnhancedQueryResponse {
  id: string;
  content: string;
  citations: Array<{
    chunk_id: string;
    document_id: string;
    text: string;
    confidence: number;
  }>;
  metadata: Record<string, any>;
  follow_up_questions?: string[];
  clarification_needed?: boolean;
}
