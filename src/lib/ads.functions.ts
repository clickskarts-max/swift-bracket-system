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

// Public Hooks
export const useActiveAds = (placementKey: string, tournamentId?: string) =>
  useQuery({
    queryKey: ["active-ads", placementKey, tournamentId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_campaigns" as any)
        .select("*, ad_creatives(*)")
        .eq("status", "active") as any);

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
