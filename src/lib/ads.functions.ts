import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AdCampaign = Tables<"ad_campaigns">;
export type AdCreative = Tables<"ad_creatives">;
export type AdPlacement = Tables<"ad_placements">;
export type AdAnalytic = Tables<"ad_analytics">;

const unwrap = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data;
};

// Admin Hooks
export const useAdCampaigns = () =>
  useQuery({
    queryKey: ["ad-campaigns"],
    queryFn: async () =>
      unwrap(
        await supabase.from("ad_campaigns").select("*, ad_creatives(*)").order("created_at", { ascending: false }),
      ) as (AdCampaign & { ad_creatives: AdCreative[] })[],
  });

export const useAdPlacements = () =>
  useQuery({
    queryKey: ["ad-placements"],
    queryFn: async () => unwrap(await supabase.from("ad_placements").select("*").order("label")),
  });

export const useAdStats = () =>
  useQuery({
    queryKey: ["ad-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_analytics")
        .select("type, campaign_id");
      
      if (error) throw error;

      const stats = data.reduce((acc: any, curr) => {
        const type = curr.type === "impression" ? "impressions" : "clicks";
        acc[type] = (acc[type] || 0) + 1;
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
      let query = supabase
        .from("ad_campaigns")
        .select("*, ad_creatives(*)")
        .eq("status", "active");

      // Apply targeting logic here if needed via JS filter or more complex query
      const { data, error } = await query;
      if (error) throw error;

      // Filter by placement and tournament targeting in JS for V1 simplicity
      const campaigns = (data as (AdCampaign & { ad_creatives: AdCreative[] })[]).filter(c => {
        const targeting = c.targeting as any;
        if (tournamentId && targeting?.tournament_ids?.length > 0) {
          return targeting.tournament_ids.includes(tournamentId);
        }
        return true;
      });

      return campaigns;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Analytics Mutations
export const useRecordAdEvent = () =>
  useMutation({
    mutationFn: async (event: Omit<TablesInsert<"ad_analytics">, "owner_id">) => {
      const { error } = await supabase.from("ad_analytics").insert(event);
      if (error) throw error;
    }
  });
