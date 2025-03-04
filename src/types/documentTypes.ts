
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
}

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  splitByHeading?: boolean;
  hierarchical?: boolean;
}

export interface LlamaIndexProcessingResult {
  chunks: Array<{ text: string; metadata: Record<string, any> }>;
  document_metadata: Record<string, any>;
  processing_metadata: Record<string, any>;
}

export type DocumentProcessor = 'custom' | 'llamaindex';

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
