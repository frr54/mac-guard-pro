export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      devices: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          mac: string
          password: string
          server_url: string
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
          user_agent: string
          user_id: string
          username: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          mac: string
          password: string
          server_url?: string
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
          user_agent?: string
          user_id: string
          username: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          mac?: string
          password?: string
          server_url?: string
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
          user_agent?: string
          user_id?: string
          username?: string
          validity_days?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          can_create_resellers: boolean
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_blocked: boolean
          name: string
          updated_at: string
        }
        Insert: {
          can_create_resellers?: boolean
          created_at?: string
          created_by?: string | null
          email: string
          id: string
          is_blocked?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          can_create_resellers?: boolean
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_blocked?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          support_whatsapp: string
          support_message: string
          global_notice_text: string
          global_notice_image_url: string
          global_notice_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          support_whatsapp?: string
          support_message?: string
          global_notice_text?: string
          global_notice_image_url?: string
          global_notice_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          support_whatsapp?: string
          support_message?: string
          global_notice_text?: string
          global_notice_image_url?: string
          global_notice_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_resellers: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "master" | "reseller"
      device_status: "active" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals }, TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never) = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never) = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never) = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals }, EnumName extends (DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never) = never> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never

export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals }, CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never) = never> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["master", "reseller"],
      device_status: ["active", "inactive"],
    },
  },
} as const
