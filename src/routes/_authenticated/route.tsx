import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ActivationGate } from "@/components/activation-gate";
import { getAppAccess, hasAccess, OWNER_EMAIL, type AppAccess } from "@/lib/activation";

const emptyProfile: AppAccess = {
  email: '',
  role: 'user',
  status: 'suspended',
  activated_until: null,
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });

      const email = data.user.email?.toLowerCase() ?? '';
      const profile = await getAppAccess(data.user.id);

      // Keep the configured owner usable even before the app_users row exists.
      if (!profile && email === OWNER_EMAIL) {
        return {
          user: data.user,
          profile: {
            email: data.user.email ?? OWNER_EMAIL,
            role: 'owner' as const,
            status: 'active' as const,
            activated_until: null,
          },
        };
      }

      return { user: data.user, profile };
    } catch (error) {
      // Preserve router redirects, but prevent missing local database setup
      // from rendering the framework's generic error page.
      if (error && typeof error === 'object' && 'isRedirect' in error) throw error;
      console.warn('[Auth] Unable to load access profile:', error);
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { profile } = Route.useRouteContext();

  if (!profile || !hasAccess(profile)) {
    return (
      <AppShell>
        <ActivationGate
          profile={profile ?? emptyProfile}
          onActivated={() => window.location.reload()}
        />
      </AppShell>
    );
  }

  return <AppShell><Outlet /></AppShell>;
}
