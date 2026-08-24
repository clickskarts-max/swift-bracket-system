import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { OverviewPanel } from "@/components/owner/overview-panel";
import { UsersPanel } from "@/components/owner/users-panel";
import { KeysPanel } from "@/components/owner/keys-panel";
import { AuditPanel } from "@/components/owner/audit-panel";
import { OWNER_EMAIL } from "@/lib/activation";

export const Route = createFileRoute("/_authenticated/owner")({
  beforeLoad: ({ context }) => {
    if (context.user.email?.toLowerCase() !== OWNER_EMAIL) throw redirect({ to: "/dashboard" });
  },
  component: OwnerAdmin,
});

const SECTION_IDS: Record<string, string> = {
  overview: "owner-overview",
  users: "owner-users",
  keys: "owner-keys",
  audit: "owner-audit",
};

function OwnerAdmin() {
  const scrollTo = (key: string) => {
    const id = SECTION_IDS[key] ?? SECTION_IDS.overview;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="space-y-8">
      <PageHeader
        title="Owner controls"
        description="Manage platform access, users and administration."
        action={
          <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Owner access
          </div>
        }
      />

      <div id="owner-overview" className="scroll-mt-24">
        <OverviewPanel onNavigate={scrollTo} />
      </div>

      <div id="owner-users" className="scroll-mt-24">
        <UsersPanel />
      </div>

      <div id="owner-keys" className="scroll-mt-24">
        <KeysPanel />
      </div>

      <div id="owner-audit" className="scroll-mt-24">
        <AuditPanel />
      </div>
    </section>
  );
}
