import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define manual types until Supabase types are regenerated
export interface AdCampaign {
  id: string;
  owner_id: string;
  name: string;
  advertiser: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'guaranteed';
  weight: number;
  targeting: any;
  allow_auto_placement: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdCreative {
  id: string;
  owner_id: string;
  campaign_id: string;
  name: string;
  type: 'image' | 'animated' | 'html';
  media_url: string;
  destination_url: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdPlacement {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  allowed_sizes: { w: number; h: number }[];
  created_at: string;
}

export interface AdAnalytic {
  id: string;
  campaign_id: string;
  creative_id: string;
  placement_id: string | null;
  tournament_id: string | null;
  type: 'impression' | 'click';
  page: string | null;
  timestamp: string;
}

export interface AdSettings {
  id?: string;
  owner_id?: string;
  auto_placement_enabled: boolean;
  auto_placement_intensity: 'low' | 'balanced' | 'high';
  public_ads_enabled: boolean;
  page_rules: Record<string, boolean>;
}

// Admin Hooks
export const useAdCampaigns = () =>
  useQuery({
    queryKey: ["ad-campaigns"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_campaigns" as any)
        .select("*, ad_creatives(*)")
        .order("created_at", { ascending: false }) as any);
      
      if (error) throw error;
      return data as (AdCampaign & { ad_creatives: AdCreative[] })[];
    },
  });

export const useAdPlacements = () =>
  useQuery({
    queryKey: ["ad-placements"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_placements" as any)
        .select("*")
        .order("label") as any);
      
      if (error) throw error;
      return data as AdPlacement[];
    },
  });

export const useAdStats = () =>
  useQuery({
    queryKey: ["ad-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_analytics" as any)
        .select("type") as any);
      
      if (error) throw error;

      const stats = (data as any[]).reduce((acc: any, curr) => {
        const typeKey = curr.type === "impression" ? "impressions" : "clicks";
        acc[typeKey] = (acc[typeKey] || 0) + 1;
        return acc;
      }, { impressions: 0, clicks: 0 });

      return stats;
    }
  });

export const useAdSettings = () =>
  useQuery({
    queryKey: ["ad-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_settings" as any)
        .select("*")
        .maybeSingle() as any);
      
      if (error) throw error;
      
      // Default fallback if no settings record exists yet
      if (!data) {
        return {
          auto_placement_enabled: true,
          auto_placement_intensity: 'balanced',
          public_ads_enabled: true,
          page_rules: {
            homepage: true,
            tournament_overview: true,
            fixtures: true,
            standings: true,
            teams: true,
            knockout: true,
            pool_draw: false
          }
        } as AdSettings;
      }
      
      return data as AdSettings;
    }
  });

// Public Hooks
export const useActiveAds = (placementKey: string, tournamentId?: string, isAuto = false) =>
  useQuery({
    queryKey: ["active-ads", placementKey, tournamentId, isAuto],
    queryFn: async () => {
      let query = supabase
        .from("ad_campaigns" as any)
        .select("*, ad_creatives(*)")
        .eq("status", "active");

      if (isAuto) {
        query = query.eq("allow_auto_placement", true);
      }

      const { data, error } = await (query as any);

      if (error) throw error;

      const campaigns = (data as (AdCampaign & { ad_creatives: AdCreative[] })[]).filter(c => {
        const targeting = c.targeting;
        if (!targeting) return true;
        if (tournamentId && targeting.tournament_ids?.length > 0) {
          return targeting.tournament_ids.includes(tournamentId);
        }
        return true;
      });

      return campaigns;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Analytics Mutations
export const useRecordAdEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Partial<AdAnalytic>) => {
      const { error } = await (supabase.from("ad_analytics" as any).insert(event) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-stats"] });
    }
  });
};

export const useUpdateAdSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<AdSettings>) => {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Not authenticated");

      const { error } = await (supabase
        .from("ad_settings" as any)
        .upsert({ ...settings, owner_id }) as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-settings"] });
    }
  });
};
