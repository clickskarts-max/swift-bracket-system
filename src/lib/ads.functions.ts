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
  tournament_targeting_mode: 'all' | 'selected' | 'none';
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
  creative_role: 'display' | 'sponsor_identity' | 'native';
  provider_type: 'direct' | 'adsense' | 'custom_provider';
  provider_config: any;
  media_url: string;
  html_content: string | null;
  destination_url: string | null;
  width: number | null;
  height: number | null;
  size_preset: string | null;
  is_responsive: boolean;
  status: 'active' | 'disabled';
  min_width: number | null;
  max_width: number | null;
  aspect_ratio: string | null;
  sponsor_name: string | null;
  sponsor_label: string | null;
  logo_dark_url: string | null;
  alt_text: string | null;
  headline: string | null;
  body_text: string | null;
  cta_label: string | null;
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
  sponsorships_enabled: boolean;
  native_ads_enabled: boolean;
  sticky_mobile_enabled: boolean;
  adsense_fallback_enabled: boolean;
  page_rules: Record<string, boolean>;
}

export interface CampaignInventoryRow {
  id: string;
  campaign_id: string;
  inventory_key: string;
  enabled: boolean;
}


// Admin Hooks
export const useAdCampaigns = () =>
  useQuery({
    queryKey: ["ad-campaigns"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_campaigns" as any)
        .select(
          "*, ad_creatives(*), ad_campaign_tournaments(tournament_id), campaign_inventory(id, campaign_id, inventory_key, enabled)",
        )
        .order("created_at", { ascending: false }) as any);
      
      if (error) throw error;
      return data as (AdCampaign & {
        ad_creatives: AdCreative[];
        ad_campaign_tournaments?: { tournament_id: string }[];
        campaign_inventory?: CampaignInventoryRow[];
      })[];
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
          sponsorships_enabled: true,
          native_ads_enabled: true,
          sticky_mobile_enabled: false,
          adsense_fallback_enabled: true,
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
      // Single request evaluates status, tournament targeting, creatives (no N+1).
      let query = supabase
        .from("ad_campaigns" as any)
        .select(
          "*, ad_creatives(*), ad_campaign_tournaments(tournament_id), campaign_inventory(inventory_key, enabled)",
        )
        .eq("status", "active")
        .neq("tournament_targeting_mode", "none");

      if (isAuto) {
        query = query.eq("allow_auto_placement", true);
      }

      // No tournament context (e.g. homepage): only "all tournaments" campaigns.
      if (!tournamentId) {
        query = query.eq("tournament_targeting_mode", "all");
      }

      const { data, error } = await (query as any);

      if (error) throw error;

      const rows = data as (AdCampaign & {
        ad_creatives: AdCreative[];
        ad_campaign_tournaments?: { tournament_id: string }[];
        campaign_inventory?: { inventory_key: string; enabled: boolean }[];
      })[];

      return rows.filter((c) => {
        const mode = c.tournament_targeting_mode ?? "all";
        if (mode === "none") return false;

        if (mode === "selected") {
          const ids = (c.ad_campaign_tournaments || []).map((t) => t.tournament_id);
          // No tournaments selected => ineligible (never falls back to "all").
          if (!tournamentId || ids.length === 0) return false;
          if (!ids.includes(tournamentId)) return false;
        }

        // Inventory selection (when configured) restricts which slots may serve.
        // Legacy campaigns without inventory rows keep serving everywhere.
        const inv = (c.campaign_inventory || []).filter((i) => i.enabled).map((i) => i.inventory_key);
        if (inv.length > 0) {
          if (isAuto) {
            if (!inv.includes("smart-auto")) return false;
          } else if (!inv.includes(placementKey)) {
            return false;
          }
        }

        // Legacy page/device targeting still applies (AND-based).
        const targeting = c.targeting;
        if (tournamentId && targeting?.tournament_ids?.length > 0) {
          return targeting.tournament_ids.includes(tournamentId);
        }
        return true;
      });

    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Campaign ↔ Tournament targeting
export const useCampaignTournaments = (campaignId: string) =>
  useQuery({
    queryKey: ["campaign-tournaments", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_campaign_tournaments" as any)
        .select("tournament_id")
        .eq("campaign_id", campaignId) as any);

      if (error) throw error;
      return (data as { tournament_id: string }[]).map((r) => r.tournament_id);
    },
  });

export const useSetCampaignTournaments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      campaignId,
      tournamentIds,
    }: {
      campaignId: string;
      tournamentIds: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Not authenticated");

      const { error: delError } = await (supabase
        .from("ad_campaign_tournaments" as any)
        .delete()
        .eq("campaign_id", campaignId) as any);
      if (delError) throw delError;

      if (tournamentIds.length > 0) {
        const { error } = await (supabase.from("ad_campaign_tournaments" as any).insert(
          tournamentIds.map((tournament_id) => ({ campaign_id: campaignId, tournament_id, owner_id })),
        ) as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-tournaments", vars.campaignId] });
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
      qc.invalidateQueries({ queryKey: ["active-ads"] });
    },
  });
};

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

// Campaign Mutations
export const useCreateAdCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Partial<AdCampaign>) => {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Not authenticated");

      const { data, error } = await (supabase
        .from("ad_campaigns" as any)
        .insert({ ...campaign, owner_id })
        .select()
        .single() as any);
      
      if (error) throw error;
      return data as AdCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
    }
  });
};

export const useUpdateAdCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdCampaign> & { id: string }) => {
      const { error } = await (supabase
        .from("ad_campaigns" as any)
        .update(updates)
        .eq("id", id) as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
    }
  });
};

export const useDeleteAdCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("ad_campaigns" as any)
        .delete()
        .eq("id", id) as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
    }
  });
};

// Creative Mutations
export const useCreateAdCreative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (creative: Partial<AdCreative>) => {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Not authenticated");

      const { data, error } = await (supabase
        .from("ad_creatives" as any)
        .insert({ ...creative, owner_id })
        .select()
        .single() as any);
      
      if (error) throw error;
      return data as AdCreative;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
    }
  });
};

export const useDeleteAdCreative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("ad_creatives" as any)
        .delete()
        .eq("id", id) as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
    }
  });
};

export const useUpdateAdCreative = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdCreative> & { id: string }) => {
      const { error } = await (supabase
        .from("ad_creatives" as any)
        .update(updates)
        .eq("id", id) as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
    }
  });
};

// ============================================================
// Inventory (display placements + sponsorship slots)
// ============================================================

export const useCampaignInventory = (campaignId: string) =>
  useQuery({
    queryKey: ["campaign-inventory", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("campaign_inventory" as any)
        .select("id, campaign_id, inventory_key, enabled")
        .eq("campaign_id", campaignId) as any);

      if (error) throw error;
      return data as CampaignInventoryRow[];
    },
  });

export const useSetCampaignInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      campaignId,
      inventoryKeys,
    }: {
      campaignId: string;
      inventoryKeys: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData.user?.id;
      if (!owner_id) throw new Error("Not authenticated");

      const { error: delError } = await (supabase
        .from("campaign_inventory" as any)
        .delete()
        .eq("campaign_id", campaignId) as any);
      if (delError) throw delError;

      if (inventoryKeys.length > 0) {
        const { error } = await (supabase.from("campaign_inventory" as any).insert(
          inventoryKeys.map((inventory_key) => ({
            campaign_id: campaignId,
            inventory_key,
            owner_id,
            enabled: true,
          })),
        ) as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-inventory", vars.campaignId] });
      qc.invalidateQueries({ queryKey: ["ad-campaigns"] });
      qc.invalidateQueries({ queryKey: ["active-ads"] });
      qc.invalidateQueries({ queryKey: ["tournament-inventory"] });
    },
  });
};

/** Per-campaign, per-inventory analytics breakdown. */
export const useCampaignPerformance = (campaignId: string) =>
  useQuery({
    queryKey: ["campaign-performance", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("ad_analytics" as any)
        .select("type, inventory_key")
        .eq("campaign_id", campaignId) as any);

      if (error) throw error;

      const map = new Map<string, { impressions: number; clicks: number }>();
      for (const row of (data as { type: string; inventory_key: string | null }[]) ?? []) {
        const key = row.inventory_key || "unassigned";
        const entry = map.get(key) ?? { impressions: 0, clicks: 0 };
        if (row.type === "click") entry.clicks += 1;
        else entry.impressions += 1;
        map.set(key, entry);
      }
      return [...map.entries()].map(([inventory_key, v]) => ({ inventory_key, ...v }));
    },
  });

export type ServedCampaign = AdCampaign & {
  ad_creatives: AdCreative[];
  ad_campaign_tournaments?: { tournament_id: string }[];
  campaign_inventory?: { inventory_key: string; enabled: boolean }[];
};

const PRIORITY_RANK: Record<string, number> = { guaranteed: 4, high: 3, normal: 2, low: 1 };

/**
 * Single query that resolves every eligible sponsorship/native slot for a
 * tournament (or the homepage when no tournament id is supplied).
 * Returns a map of inventory_key -> served campaigns, so slots never fan out
 * into N+1 requests.
 */
export const useTournamentInventory = (tournamentId?: string) =>
  useQuery({
    queryKey: ["tournament-inventory", tournamentId ?? "global"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let query = supabase
        .from("ad_campaigns" as any)
        .select(
          "*, ad_creatives(*), ad_campaign_tournaments(tournament_id), campaign_inventory(inventory_key, enabled)",
        )
        .eq("status", "active")
        .neq("tournament_targeting_mode", "none");

      if (!tournamentId) query = query.eq("tournament_targeting_mode", "all");

      const { data, error } = await (query as any);
      if (error) throw error;

      const rows = (data as ServedCampaign[]) ?? [];

      const eligible = rows.filter((c) => {
        const mode = c.tournament_targeting_mode ?? "all";
        if (mode === "selected") {
          const ids = (c.ad_campaign_tournaments || []).map((t) => t.tournament_id);
          if (!tournamentId || ids.length === 0 || !ids.includes(tournamentId)) return false;
        }
        return true;
      });

      const map: Record<string, ServedCampaign[]> = {};
      for (const c of eligible) {
        for (const inv of c.campaign_inventory ?? []) {
          if (!inv.enabled) continue;
          (map[inv.inventory_key] ||= []).push(c);
        }
      }

      // Deterministic ordering: priority, then weight, then oldest commitment.
      for (const key of Object.keys(map)) {
        map[key]!.sort(
          (a, b) =>
            (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0) ||
            (b.weight ?? 1) - (a.weight ?? 1) ||
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }

      return map;
    },
  });
