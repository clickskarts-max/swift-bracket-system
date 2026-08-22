import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Organization = Tables<"organizations">;

const unwrap = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Hook to resolve organization branding.
 * It identifies the organization either by:
 * 1. Custom domain (hostname matching)
 * 2. Authenticated user's organization (if signed in)
 * 3. Default fallback
 */
export function useBranding() {
  return useQuery({
    queryKey: ["branding", typeof window !== "undefined" ? window.location.hostname : "ssr"],
    queryFn: async () => {
      // 1. Try by custom domain
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const { data: byDomain } = await supabase
          .from("organizations")
          .select("*")
          .eq("custom_domain", hostname)
          .maybeSingle();
        
        if (byDomain) return byDomain as Organization;
      }

      // 2. Try by authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: byUser } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();
        
        if (byUser) return byUser as Organization;
      }

      // 3. Fallback (first organization or null)
      const { data: fallback } = await supabase
        .from("organizations")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      return (fallback as Organization) || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
