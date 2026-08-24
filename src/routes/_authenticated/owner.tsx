import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "keys", label: "Activation" },
  { value: "audit", label: "Audit log" },
] as const;

function OwnerAdmin() {
  const [tab, setTab] = useState<string>("overview");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Platform administration"
        description="Owner-only command center for access, tournaments and commercial operations."
        action={
          <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Owner access
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel onNavigate={(next) => setTab(TABS.some((t) => t.value === next) ? next : "overview")} />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="keys">
          <KeysPanel />
        </TabsContent>
        <TabsContent value="audit">
          <AuditPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}
