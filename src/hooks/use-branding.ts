import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Organization = Tables<"organizations">;

/**
 * Public branding for the current host.
 * Reads a restricted server-side view of the organization that exposes only
 * branding fields (and contact details when the owner opted in).
 */
export function useBranding() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  return useQuery({
    queryKey: ["branding", hostname || "ssr"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_branding", {
        p_hostname: hostname,
      });
      if (error) throw new Error(error.message);
      const row = Array.isArray(data) ? data[0] : data;
      return (row as Partial<Organization> | undefined) ?? null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
