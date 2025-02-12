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
      parameter_tweaks: {
        Row: {
          created_at: string
          id: string
          name: string
          parameter_id: string | null
          sub_prompt: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parameter_id?: string | null
          sub_prompt: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parameter_id?: string | null
          sub_prompt?: string
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
      prompt_parameter_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          order: number
          parameter_id: string
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
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["prompt_parameter_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["prompt_parameter_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["prompt_parameter_type"]
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_default: boolean
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
          id?: string
          is_default?: boolean
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
          id?: string
          is_default?: boolean
          prompt?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
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
