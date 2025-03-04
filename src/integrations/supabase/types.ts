export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      context_cache: {
        Row: {
          cache_key: string
          created_at: string
          hub_area: string | null
          id: string
          query: string
          results: Json
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          hub_area?: string | null
          id?: string
          query: string
          results: Json
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          hub_area?: string | null
          id?: string
          query?: string
          results?: Json
          updated_at?: string
        }
        Relationships: []
      }
      custom_prompts: {
        Row: {
          base_prompt_id: string | null
          created_at: string
          created_by: string | null
          id: string
          updated_at: string
        }
        Insert: {
          base_prompt_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          base_prompt_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_prompts_base_prompt_id_fkey"
            columns: ["base_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_references: {
        Row: {
          citation_context: string | null
          created_at: string
          document_id: string
          id: string
          prompt_generation_id: string
          relevance_score: number | null
        }
        Insert: {
          citation_context?: string | null
          created_at?: string
          document_id: string
          id?: string
          prompt_generation_id: string
          relevance_score?: number | null
        }
        Update: {
          citation_context?: string | null
          created_at?: string
          document_id?: string
          id?: string
          prompt_generation_id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_references_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_prompt_generation_id_fkey"
            columns: ["prompt_generation_id"]
            isOneToOne: false
            referencedRelation: "prompt_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          changes: Json | null
          created_at: string
          document_id: string
          id: string
          version: number
        }
        Insert: {
          changes?: Json | null
          created_at?: string
          document_id: string
          id?: string
          version: number
        }
        Update: {
          changes?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          embedding: string | null
          file_type: Database["public"]["Enums"]["document_file_type"]
          hub_areas: Database["public"]["Enums"]["hub_area_type"][]
          id: string
          metadata: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          file_type: Database["public"]["Enums"]["document_file_type"]
          hub_areas?: Database["public"]["Enums"]["hub_area_type"][]
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          file_type?: Database["public"]["Enums"]["document_file_type"]
          hub_areas?: Database["public"]["Enums"]["hub_area_type"][]
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      node_relationships: {
        Row: {
          child_chunk_id: string
          created_at: string
          id: string
          parent_chunk_id: string
          relationship_type: string
        }
        Insert: {
          child_chunk_id: string
          created_at?: string
          id?: string
          parent_chunk_id: string
          relationship_type: string
        }
        Update: {
          child_chunk_id?: string
          created_at?: string
          id?: string
          parent_chunk_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_relationships_child_chunk_id_fkey"
            columns: ["child_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_relationships_parent_chunk_id_fkey"
            columns: ["parent_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      parameter_tweaks: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          order: number
          parameter_id: string | null
          sub_prompt: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          order?: number
          parameter_id?: string | null
          sub_prompt: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          order?: number
          parameter_id?: string | null
          sub_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parameter_tweaks_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "prompt_parameters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          brand_voice: string | null
          business_name: string | null
          description: string | null
          id: string
          industry: string | null
          target_audience: string | null
          updated_at: string
          values: string | null
        }
        Insert: {
          brand_voice?: string | null
          business_name?: string | null
          description?: string | null
          id: string
          industry?: string | null
          target_audience?: string | null
          updated_at?: string
          values?: string | null
        }
        Update: {
          brand_voice?: string | null
          business_name?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          target_audience?: string | null
          updated_at?: string
          values?: string | null
        }
        Relationships: []
      }
      prompt_additional_context: {
        Row: {
          context_text: string
          created_at: string
          custom_prompt_id: string
          id: string
        }
        Insert: {
          context_text: string
          created_at?: string
          custom_prompt_id: string
          id?: string
        }
        Update: {
          context_text?: string
          created_at?: string
          custom_prompt_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_additional_context_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: false
            referencedRelation: "custom_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_customizations: {
        Row: {
          created_at: string
          custom_prompt_id: string | null
          id: string
          parameter_tweak_id: string | null
        }
        Insert: {
          created_at?: string
          custom_prompt_id?: string | null
          id?: string
          parameter_tweak_id?: string | null
        }
        Update: {
          created_at?: string
          custom_prompt_id?: string | null
          id?: string
          parameter_tweak_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_customizations_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: false
            referencedRelation: "custom_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_customizations_parameter_tweak_id_fkey"
            columns: ["parameter_tweak_id"]
            isOneToOne: false
            referencedRelation: "parameter_tweaks"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_generations: {
        Row: {
          created_at: string
          created_by: string
          custom_prompt_id: string
          generated_content: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          custom_prompt_id: string
          generated_content: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          custom_prompt_id?: string
          generated_content?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_generations_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: false
            referencedRelation: "custom_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_parameter_enabled_tweaks: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          parameter_id: string
          parameter_tweak_id: string
          prompt_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          parameter_id: string
          parameter_tweak_id: string
          prompt_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          parameter_id?: string
          parameter_tweak_id?: string
          prompt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_parameter_enabled_tweaks_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "prompt_parameters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_parameter_enabled_tweaks_parameter_tweak_id_fkey"
            columns: ["parameter_tweak_id"]
            isOneToOne: false
            referencedRelation: "parameter_tweaks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_parameter_enabled_tweaks_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_parameter_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          order: number
          parameter_id: string
          parameter_order: number | null
          prompt_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          order: number
          parameter_id: string
          parameter_order?: number | null
          prompt_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          order?: number
          parameter_id?: string
          parameter_order?: number | null
          prompt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_parameter_rules_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "prompt_parameters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_parameter_rules_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_parameters: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["prompt_parameter_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["prompt_parameter_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["prompt_parameter_type"]
          updated_at?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          hub_area: Database["public"]["Enums"]["hub_area_type"] | null
          icon_name: string | null
          id: string
          is_category: boolean
          is_default: boolean
          parent_id: string | null
          prompt: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          display_order?: number
          hub_area?: Database["public"]["Enums"]["hub_area_type"] | null
          icon_name?: string | null
          id?: string
          is_category?: boolean
          is_default?: boolean
          parent_id?: string | null
          prompt: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          hub_area?: Database["public"]["Enums"]["hub_area_type"] | null
          icon_name?: string | null
          id?: string
          is_category?: boolean
          is_default?: boolean
          parent_id?: string | null
          prompt?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_generations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          slug: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          slug?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          slug?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_update_parameter_tweaks: {
        Args: {
          p_parameter_id: string
          p_tweaks: Json
        }
        Returns: {
          active: boolean
          created_at: string
          id: string
          name: string
          order: number
          parameter_id: string | null
          sub_prompt: string
          updated_at: string
        }[]
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      count_document_chunks: {
        Args: {
          document_id: string
        }
        Returns: {
          count: number
        }[]
      }
      get_document_chunks: {
        Args: {
          doc_id: string
        }
        Returns: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_document_chunks: {
        Args: {
          query_embedding: string
          similarity_threshold: number
          match_count: number
          filter_document_id?: string
          filter_hub_area?: string
        }
        Returns: {
          id: string
          document_id: string
          content: string
          metadata: Json
          chunk_index: number
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          query_embedding: string
          similarity_threshold: number
          match_count: number
          filter_hub_area?: string
        }
        Returns: {
          id: string
          title: string
          content: string
          file_type: string
          hub_areas: string[]
          created_at: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      document_file_type: "pdf" | "doc" | "docx" | "txt" | "md" | "html"
      hub_area_type:
        | "marketing"
        | "sales"
        | "production"
        | "team"
        | "strategy"
        | "financials"
        | "leadership"
      prompt_parameter_type:
        | "tone_and_style"
        | "audience_specificity"
        | "purpose_and_intent"
        | "content_details"
        | "output_format"
        | "length_and_depth"
        | "call_to_action"
        | "customization_branding"
        | "constraints"
        | "iteration_feedback"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
