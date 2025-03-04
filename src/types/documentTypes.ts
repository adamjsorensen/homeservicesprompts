
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
