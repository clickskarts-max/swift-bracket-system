import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/use-branding";
import { KpiCard, SectionCard } from "@/components/owner/owner-ui";
import { IntegrationsPanel } from "@/components/owner/integrations-panel";

const COPY: Record<string, { title: string; description: string; body: string }> = {
  general: {
    title: "General",
    description: "Platform name and organization details.",
    body: "Organization name, contact details and defaults are edited in Settings › General.",
  },
  branding: {
    title: "Branding",
    description: "Logos, favicon and colour tokens.",
    body: "Light/dark logos, favicon and brand colours are edited in Settings › Branding with a live preview.",
  },
  public: {
    title: "Public pages",
    description: "What public tournament pages expose.",
    body: "Logo, name and contact visibility for public pages are toggled in Settings › Public pages.",
  },
  features: {
    title: "Features",
    description: "Platform-wide feature toggles.",
    body: "Advertising master switches (public ads, sponsorships, native, sticky mobile, AdSense fallback) live in the Ads & Sponsors workspace.",
  },
  integrations: {
    title: "Integrations",
    description: "External services.",
    body: "AdSense and external ad providers are configured per creative inside a campaign.",
  },
  system: {
    title: "System",
    description: "Technical settings and account security.",
    body: "Password and session security are managed in Settings › Security. Destructive database controls are intentionally not exposed here.",
  },
};

export function PlatformPanel({ tab }: { tab: string }) {
  const { data: org } = useBranding();
  const copy = COPY[tab] ?? COPY["general"]!;

  if (tab === "integrations") {
    return (
      <div className="space-y-5">
        <SectionCard
          title="Integrations"
          description="Connect Ecluid Basketball to external services. Credentials are stored securely on the server."
        >
          <p className="text-sm text-muted-foreground">
            Connect, test, sync, enable/disable or disconnect each service below. AdSense and
            external ad providers remain configured per creative inside a campaign.
          </p>
        </SectionCard>
        <IntegrationsPanel />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Organization" value={org?.brand_name || org?.name || "Ecluid"} />
        <KpiCard label="Public branding" value={org?.show_logo_public ? "On" : "Off"} />
        <KpiCard label="Powered by badge" value={org?.powered_by_enabled === false ? "Hidden" : "Shown"} />
      </div>

      <SectionCard
        title={copy.title}
        description={copy.description}
        action={
          <Button asChild size="sm" variant="outline">
            <Link to={tab === "features" || tab === "integrations" ? "/advertising" : "/settings"}>
              Open
            </Link>
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">{copy.body}</p>
      </SectionCard>
    </div>
  );
}
