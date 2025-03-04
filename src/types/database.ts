
export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, any>;
  chunk_index: number;
  created_at: string;
  updated_at: string;
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
