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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      matches: {
        Row: {
          court: string | null
          created_at: string
          group_label: string | null
          id: string
          leg: number
          match_no: number | null
          notes: string | null
          owner_id: string
          placeholder_a: string | null
          placeholder_b: string | null
          referee: string | null
          round_index: number
          round_name: string | null
          scheduled_at: string | null
          score_a: number | null
          score_b: number | null
          stage: string
          status: string
          team_a_id: string | null
          team_b_id: string | null
          tournament_id: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          court?: string | null
          created_at?: string
          group_label?: string | null
          id?: string
          leg?: number
          match_no?: number | null
          notes?: string | null
          owner_id: string
          placeholder_a?: string | null
          placeholder_b?: string | null
          referee?: string | null
          round_index?: number
          round_name?: string | null
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          stage?: string
          status?: string
          team_a_id?: string | null
          team_b_id?: string | null
          tournament_id: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          court?: string | null
          created_at?: string
          group_label?: string | null
          id?: string
          leg?: number
          match_no?: number | null
          notes?: string | null
          owner_id?: string
          placeholder_a?: string | null
          placeholder_b?: string | null
          referee?: string | null
          round_index?: number
          round_name?: string | null
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          stage?: string
          status?: string
          team_a_id?: string | null
          team_b_id?: string | null
          tournament_id?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          primary_color: string | null
          socials: Json
          updated_at: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id: string
          primary_color?: string | null
          socials?: Json
          updated_at?: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          socials?: Json
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          age: number | null
          created_at: string
          height_cm: number | null
          id: string
          jersey_number: number | null
          name: string
          owner_id: string
          photo_url: string | null
          position: string | null
          stats: Json
          team_id: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          name: string
          owner_id: string
          photo_url?: string | null
          position?: string | null
          stats?: Json
          team_id?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          name?: string
          owner_id?: string
          photo_url?: string | null
          position?: string | null
          stats?: Json
          team_id?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          amount: number | null
          contact_person: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          owner_id: string
          placement: string | null
          tier: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contact_person?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          owner_id: string
          placement?: string | null
          tier?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contact_person?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          placement?: string | null
          tier?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          coach_name: string | null
          contact: string | null
          created_at: string
          group_label: string | null
          id: string
          jersey_color: string | null
          logo_url: string | null
          manager_name: string | null
          name: string
          owner_id: string
          seed: number | null
          short_name: string | null
          socials: Json
          tournament_id: string
          updated_at: string
        }
        Insert: {
          coach_name?: string | null
          contact?: string | null
          created_at?: string
          group_label?: string | null
          id?: string
          jersey_color?: string | null
          logo_url?: string | null
          manager_name?: string | null
          name: string
          owner_id: string
          seed?: number | null
          short_name?: string | null
          socials?: Json
          tournament_id: string
          updated_at?: string
        }
        Update: {
          coach_name?: string | null
          contact?: string | null
          created_at?: string
          group_label?: string | null
          id?: string
          jersey_color?: string | null
          logo_url?: string | null
          manager_name?: string | null
          name?: string
          owner_id?: string
          seed?: number | null
          short_name?: string | null
          socials?: Json
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          archived: boolean
          banner_url: string | null
          config: Json
          created_at: string
          description: string | null
          end_date: string | null
          format: string
          group_count: number
          id: string
          is_public: boolean
          legs: number
          logo_url: string | null
          name: string
          owner_id: string
          playoff_format: string
          slug: string
          start_date: string | null
          status: string
          team_count: number
          updated_at: string
          venue: string | null
          venue_map_url: string | null
        }
        Insert: {
          archived?: boolean
          banner_url?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          end_date?: string | null
          format?: string
          group_count?: number
          id?: string
          is_public?: boolean
          legs?: number
          logo_url?: string | null
          name: string
          owner_id: string
          playoff_format?: string
          slug: string
          start_date?: string | null
          status?: string
          team_count?: number
          updated_at?: string
          venue?: string | null
          venue_map_url?: string | null
        }
        Update: {
          archived?: boolean
          banner_url?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          end_date?: string | null
          format?: string
          group_count?: number
          id?: string
          is_public?: boolean
          legs?: number
          logo_url?: string | null
          name?: string
          owner_id?: string
          playoff_format?: string
          slug?: string
          start_date?: string | null
          status?: string
          team_count?: number
          updated_at?: string
          venue?: string | null
          venue_map_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      tournament_is_public: { Args: { _tid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
