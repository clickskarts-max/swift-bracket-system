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
      activation_keys: {
        Row: {
          assigned_email: string | null
          created_at: string
          created_by: string | null
          duration_days: number | null
          expires_at: string | null
          id: string
          key: string
          max_redemptions: number
          note: string | null
          plan: string
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_count: number
          revoked: boolean
          updated_at: string
        }
        Insert: {
          assigned_email?: string | null
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          key: string
          max_redemptions?: number
          note?: string | null
          plan: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_count?: number
          revoked?: boolean
          updated_at?: string
        }
        Update: {
          assigned_email?: string | null
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          key?: string
          max_redemptions?: number
          note?: string | null
          plan?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_count?: number
          revoked?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ad_analytics: {
        Row: {
          campaign_id: string
          creative_id: string
          id: string
          inventory_key: string | null
          page: string | null
          placement_id: string | null
          timestamp: string | null
          tournament_id: string | null
          type: string | null
        }
        Insert: {
          campaign_id: string
          creative_id: string
          id?: string
          inventory_key?: string | null
          page?: string | null
          placement_id?: string | null
          timestamp?: string | null
          tournament_id?: string | null
          type?: string | null
        }
        Update: {
          campaign_id?: string
          creative_id?: string
          id?: string
          inventory_key?: string | null
          page?: string | null
          placement_id?: string | null
          timestamp?: string | null
          tournament_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaign_tournaments: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          owner_id: string
          tournament_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          owner_id: string
          tournament_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaign_tournaments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaign_tournaments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          advertiser: string | null
          allow_auto_placement: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          owner_id: string
          priority: string | null
          start_date: string | null
          status: string | null
          targeting: Json | null
          tournament_targeting_mode: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          advertiser?: string | null
          allow_auto_placement?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner_id: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          targeting?: Json | null
          tournament_targeting_mode?: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          advertiser?: string | null
          allow_auto_placement?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          targeting?: Json | null
          tournament_targeting_mode?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      ad_creatives: {
        Row: {
          alt_text: string | null
          aspect_ratio: string | null
          body_text: string | null
          campaign_id: string
          created_at: string | null
          creative_role: string
          cta_label: string | null
          destination_url: string | null
          headline: string | null
          height: number | null
          html_content: string | null
          id: string
          is_responsive: boolean | null
          logo_dark_url: string | null
          max_width: number | null
          media_url: string
          min_width: number | null
          name: string
          owner_id: string
          provider_config: Json | null
          provider_type: string | null
          size_preset: string | null
          sponsor_label: string | null
          sponsor_name: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          aspect_ratio?: string | null
          body_text?: string | null
          campaign_id: string
          created_at?: string | null
          creative_role?: string
          cta_label?: string | null
          destination_url?: string | null
          headline?: string | null
          height?: number | null
          html_content?: string | null
          id?: string
          is_responsive?: boolean | null
          logo_dark_url?: string | null
          max_width?: number | null
          media_url: string
          min_width?: number | null
          name: string
          owner_id: string
          provider_config?: Json | null
          provider_type?: string | null
          size_preset?: string | null
          sponsor_label?: string | null
          sponsor_name?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          aspect_ratio?: string | null
          body_text?: string | null
          campaign_id?: string
          created_at?: string | null
          creative_role?: string
          cta_label?: string | null
          destination_url?: string | null
          headline?: string | null
          height?: number | null
          html_content?: string | null
          id?: string
          is_responsive?: boolean | null
          logo_dark_url?: string | null
          max_width?: number | null
          media_url?: string
          min_width?: number | null
          name?: string
          owner_id?: string
          provider_config?: Json | null
          provider_type?: string | null
          size_preset?: string | null
          sponsor_label?: string | null
          sponsor_name?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_placements: {
        Row: {
          allowed_sizes: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          key: string
          label: string
        }
        Insert: {
          allowed_sizes?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          key: string
          label: string
        }
        Update: {
          allowed_sizes?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      ad_settings: {
        Row: {
          adsense_fallback_enabled: boolean
          auto_placement_enabled: boolean | null
          auto_placement_intensity: string | null
          created_at: string | null
          id: string
          native_ads_enabled: boolean
          owner_id: string
          page_rules: Json | null
          public_ads_enabled: boolean | null
          sponsorships_enabled: boolean
          sticky_mobile_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          adsense_fallback_enabled?: boolean
          auto_placement_enabled?: boolean | null
          auto_placement_intensity?: string | null
          created_at?: string | null
          id?: string
          native_ads_enabled?: boolean
          owner_id: string
          page_rules?: Json | null
          public_ads_enabled?: boolean | null
          sponsorships_enabled?: boolean
          sticky_mobile_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          adsense_fallback_enabled?: boolean
          auto_placement_enabled?: boolean | null
          auto_placement_intensity?: string | null
          created_at?: string | null
          id?: string
          native_ads_enabled?: boolean
          owner_id?: string
          page_rules?: Json | null
          public_ads_enabled?: boolean | null
          sponsorships_enabled?: boolean
          sticky_mobile_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          activated_until: string | null
          created_at: string
          email: string
          id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_until?: string | null
          created_at?: string
          email: string
          id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_until?: string | null
          created_at?: string
          email?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after_value: Json | null
          before_value: Json | null
          created_at: string
          id: string
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      campaign_inventory: {
        Row: {
          campaign_id: string
          created_at: string
          enabled: boolean
          id: string
          inventory_key: string
          owner_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          inventory_key: string
          owner_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          inventory_key?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_inventory_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
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
          periods: Json
          placeholder_a: string | null
          placeholder_b: string | null
          player_of_match_id: string | null
          player_stats: Json
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
          venue_id: string | null
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
          periods?: Json
          placeholder_a?: string | null
          placeholder_b?: string | null
          player_of_match_id?: string | null
          player_stats?: Json
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
          venue_id?: string | null
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
          periods?: Json
          placeholder_a?: string | null
          placeholder_b?: string | null
          player_of_match_id?: string | null
          player_stats?: Json
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
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player_of_match_id_fkey"
            columns: ["player_of_match_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "matches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "tournament_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          brand_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          custom_domain: string | null
          favicon_url: string | null
          footer_text: string | null
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          name: string
          owner_id: string
          powered_by_enabled: boolean | null
          primary_color: string | null
          secondary_color: string | null
          short_name: string | null
          show_contact_public: boolean
          show_logo_public: boolean
          show_name_public: boolean
          socials: Json
          updated_at: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          brand_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          name?: string
          owner_id: string
          powered_by_enabled?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          show_contact_public?: boolean
          show_logo_public?: boolean
          show_name_public?: boolean
          socials?: Json
          updated_at?: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          brand_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          powered_by_enabled?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          show_contact_public?: boolean
          show_logo_public?: boolean
          show_name_public?: boolean
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
      tournament_venues: {
        Row: {
          address: string | null
          created_at: string
          google_maps_url: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          google_maps_url?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          google_maps_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_venues_tournament_id_fkey"
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
          qualifiers_per_group: number
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
          qualifiers_per_group?: number
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
          qualifiers_per_group?: number
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
      ensure_app_user: {
        Args: never
        Returns: {
          activated_until: string | null
          created_at: string
          email: string
          id: string
          role: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "app_users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_app_owner: { Args: never; Returns: boolean }
      log_owner_action: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_target_id?: string
          p_target_label?: string
          p_target_type?: string
        }
        Returns: undefined
      }
      owner_create_activation_key: {
        Args: { input_plan: string }
        Returns: string
      }
      owner_create_key: {
        Args: {
          input_assigned_email?: string
          input_days?: number
          input_expires_at?: string
          input_max_redemptions?: number
          input_note?: string
          input_plan: string
        }
        Returns: string
      }
      owner_delete_key: { Args: { input_id: string }; Returns: undefined }
      owner_list_users: {
        Args: never
        Returns: {
          activated_until: string
          created_at: string
          email: string
          id: string
          role: string
          status: string
          tournament_count: number
        }[]
      }
      owner_overview: { Args: never; Returns: Json }
      owner_revoke_activation_key: {
        Args: { input_id: string }
        Returns: undefined
      }
      owner_set_user_access: {
        Args: {
          input_email: string
          input_unlimited?: boolean
          input_until?: string
        }
        Returns: string
      }
      owner_set_user_status: {
        Args: { input_email: string; input_status: string }
        Returns: undefined
      }
      redeem_activation_key: { Args: { input_key: string }; Returns: string }
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
