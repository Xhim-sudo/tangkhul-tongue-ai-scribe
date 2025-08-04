export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accuracy_metrics: {
        Row: {
          accuracy_percentage: number | null
          contributor_id: string
          golden_data_count: number | null
          id: string
          last_calculated: string
          total_contributions: number | null
          validated_contributions: number | null
        }
        Insert: {
          accuracy_percentage?: number | null
          contributor_id: string
          golden_data_count?: number | null
          id?: string
          last_calculated?: string
          total_contributions?: number | null
          validated_contributions?: number | null
        }
        Update: {
          accuracy_percentage?: number | null
          contributor_id?: string
          golden_data_count?: number | null
          id?: string
          last_calculated?: string
          total_contributions?: number | null
          validated_contributions?: number | null
        }
        Relationships: []
      }
      contributor_datasets: {
        Row: {
          accuracy_score: number | null
          category: string | null
          context: string | null
          contributor_id: string
          created_at: string
          english_text: string
          id: string
          is_golden_data: boolean | null
          tags: string[] | null
          tangkhul_text: string
          updated_at: string
          validation_count: number | null
        }
        Insert: {
          accuracy_score?: number | null
          category?: string | null
          context?: string | null
          contributor_id: string
          created_at?: string
          english_text: string
          id?: string
          is_golden_data?: boolean | null
          tags?: string[] | null
          tangkhul_text: string
          updated_at?: string
          validation_count?: number | null
        }
        Update: {
          accuracy_score?: number | null
          category?: string | null
          context?: string | null
          contributor_id?: string
          created_at?: string
          english_text?: string
          id?: string
          is_golden_data?: boolean | null
          tags?: string[] | null
          tangkhul_text?: string
          updated_at?: string
          validation_count?: number | null
        }
        Relationships: []
      }
      data_exports: {
        Row: {
          export_type: string
          exported_at: string
          file_format: string
          file_size: number | null
          id: string
          record_count: number
          user_id: string
        }
        Insert: {
          export_type: string
          exported_at?: string
          file_format: string
          file_size?: number | null
          id?: string
          record_count: number
          user_id: string
        }
        Update: {
          export_type?: string
          exported_at?: string
          file_format?: string
          file_size?: number | null
          id?: string
          record_count?: number
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          staff_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_id?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      management_access: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          password_hash: string
          password_label: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          password_hash: string
          password_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          password_hash?: string
          password_label?: string | null
        }
        Relationships: []
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
      training_entries: {
        Row: {
          category: string | null
          confidence_score: number | null
          context: string | null
          contributor_id: string
          created_at: string
          english_text: string
          id: string
          reviewer_id: string | null
          status: string | null
          tags: string[] | null
          tangkhul_text: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          context?: string | null
          contributor_id: string
          created_at?: string
          english_text: string
          id?: string
          reviewer_id?: string | null
          status?: string | null
          tags?: string[] | null
          tangkhul_text: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          context?: string | null
          contributor_id?: string
          created_at?: string
          english_text?: string
          id?: string
          reviewer_id?: string | null
          status?: string | null
          tags?: string[] | null
          tangkhul_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          confidence_score: number | null
          created_at: string
          feedback_rating: number | null
          id: string
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          feedback_rating?: number | null
          id?: string
          source_language?: string
          source_text: string
          target_language?: string
          translated_text: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          feedback_rating?: number | null
          id?: string
          source_language?: string
          source_text?: string
          target_language?: string
          translated_text?: string
          user_id?: string | null
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
          invited_by: string
          phone_number: string
          status: string | null
          user_id: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by: string
          phone_number: string
          status?: string | null
          user_id: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string
          phone_number?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          delivered_at: string | null
          id: string
          message_content: string
          message_type: string
          recipient_phone: string
          sent_at: string
          status: string | null
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          message_content: string
          message_type: string
          recipient_phone: string
          sent_at?: string
          status?: string | null
        }
        Update: {
          delivered_at?: string | null
          id?: string
          message_content?: string
          message_type?: string
          recipient_phone?: string
          sent_at?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_contributor_accuracy: {
        Args: { contributor_uuid: string }
        Returns: number
      }
      generate_staff_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      mark_golden_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "expert" | "reviewer" | "contributor"
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
    },
  },
} as const
