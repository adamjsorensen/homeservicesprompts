
import { DocumentChunk } from './documentTypes';

export interface QueryAnalysis {
  subQuestions: string[];
  requiredContextTypes: string[];
  confidenceScores: number[];
  suggestedFilters: Record<string, any>;
}

export interface QueryContext {
  relevantChunks: DocumentChunk[];
  relatedDocuments: string[];
  confidence: number;
  sourceTypes: string[];
}

export interface StructuredResponse {
  content: string;
  citations: Array<{
    documentId: string;
    context: string;
    relevance: number;
  }>;
  metadata: {
    confidence: number;
    sourceDiversity: number;
    completeness: number;
  };
  followUpQuestions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  confidenceScore: number;
  validationDetails: Record<string, any>;
}
