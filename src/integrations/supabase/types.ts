export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accuracy_metrics: {
        Row: {
          contributor_id: string
          created_at: string
          details: Json | null
          entry_id: string | null
          id: string
          metric_type: string
          score: number
        }
        Insert: {
          contributor_id: string
          created_at?: string
          details?: Json | null
          entry_id?: string | null
          id?: string
          metric_type: string
          score: number
        }
        Update: {
          contributor_id?: string
          created_at?: string
          details?: Json | null
          entry_id?: string | null
          id?: string
          metric_type?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "accuracy_metrics_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accuracy_metrics_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "training_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      contributor_datasets: {
        Row: {
          accuracy_score: number | null
          approved_submissions: number | null
          contributor_id: string
          created_at: string
          id: string
          last_submission_at: string | null
          rejected_submissions: number | null
          total_submissions: number | null
          updated_at: string
        }
        Insert: {
          accuracy_score?: number | null
          approved_submissions?: number | null
          contributor_id: string
          created_at?: string
          id?: string
          last_submission_at?: string | null
          rejected_submissions?: number | null
          total_submissions?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_score?: number | null
          approved_submissions?: number | null
          contributor_id?: string
          created_at?: string
          id?: string
          last_submission_at?: string | null
          rejected_submissions?: number | null
          total_submissions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributor_datasets_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          export_type: string
          file_url: string | null
          id: string
          status: Database["public"]["Enums"]["export_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_type: string
          file_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["export_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_type?: string
          file_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["export_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      training_entries: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          contributor_id: string
          created_at: string
          english_text: string
          id: string
          is_golden_data: boolean | null
          review_count: number | null
          tangkhul_text: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number | null
          contributor_id: string
          created_at?: string
          english_text: string
          id?: string
          is_golden_data?: boolean | null
          review_count?: number | null
          tangkhul_text: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          confidence_score?: number | null
          contributor_id?: string
          created_at?: string
          english_text?: string
          id?: string
          is_golden_data?: boolean | null
          review_count?: number | null
          tangkhul_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "training_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_entries_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_submissions_log: {
        Row: {
          category_id: string | null
          contributor_id: string
          created_at: string
          english_text: string
          grammar_features: Json | null
          id: string
          is_golden_data: boolean | null
          linguistic_notes: string | null
          tangkhul_text: string
        }
        Insert: {
          category_id?: string | null
          contributor_id: string
          created_at?: string
          english_text: string
          grammar_features?: Json | null
          id?: string
          is_golden_data?: boolean | null
          linguistic_notes?: string | null
          tangkhul_text: string
        }
        Update: {
          category_id?: string | null
          contributor_id?: string
          created_at?: string
          english_text?: string
          grammar_features?: Json | null
          id?: string
          is_golden_data?: boolean | null
          linguistic_notes?: string | null
          tangkhul_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_submissions_log_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "training_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_submissions_log_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_analytics: {
        Row: {
          cache_hit: boolean | null
          confidence_score: number | null
          created_at: string
          id: string
          query_text: string
          response_time_ms: number | null
          result_found: boolean
          source_language: string
          target_language: string
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          query_text: string
          response_time_ms?: number | null
          result_found: boolean
          source_language: string
          target_language: string
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          query_text?: string
          response_time_ms?: number | null
          result_found?: boolean
          source_language?: string
          target_language?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_cache: {
        Row: {
          confidence_score: number | null
          created_at: string
          hit_count: number | null
          id: string
          last_used_at: string
          source_lang: string
          source_text: string
          target_lang: string
          target_text: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          hit_count?: number | null
          id?: string
          last_used_at?: string
          source_lang: string
          source_text: string
          target_lang: string
          target_text: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          hit_count?: number | null
          id?: string
          last_used_at?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          target_text?: string
        }
        Relationships: []
      }
      translation_consensus: {
        Row: {
          agreement_score: number
          created_at: string
          english_text: string
          id: string
          is_golden_data: boolean | null
          is_promoted: boolean | null
          review_count: number
          submission_count: number | null
          tangkhul_text: string
          updated_at: string
        }
        Insert: {
          agreement_score?: number
          created_at?: string
          english_text: string
          id?: string
          is_golden_data?: boolean | null
          is_promoted?: boolean | null
          review_count?: number
          submission_count?: number | null
          tangkhul_text: string
          updated_at?: string
        }
        Update: {
          agreement_score?: number
          created_at?: string
          english_text?: string
          id?: string
          is_golden_data?: boolean | null
          is_promoted?: boolean | null
          review_count?: number
          submission_count?: number | null
          tangkhul_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_approvals: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_approvals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_text: string
          recipient_phone: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_text: string
          recipient_phone: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_text?: string
          recipient_phone?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      generate_staff_id: { Args: never; Returns: string }
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      mark_golden_data: { Args: { entry_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "expert" | "reviewer" | "contributor"
      approval_status: "pending" | "approved" | "rejected"
      export_status: "pending" | "processing" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "expert", "reviewer", "contributor"],
      approval_status: ["pending", "approved", "rejected"],
      export_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
