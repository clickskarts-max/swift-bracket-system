import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ClipboardList, KeyRound, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { OverviewPanel } from "@/components/owner/overview-panel";
import { UsersPanel } from "@/components/owner/users-panel";
import { KeysPanel } from "@/components/owner/keys-panel";
import { AuditPanel } from "@/components/owner/audit-panel";
import { OWNER_EMAIL } from "@/lib/activation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/owner")({
  beforeLoad: ({ context }) => {
    if (context.user.email?.toLowerCase() !== OWNER_EMAIL) throw redirect({ to: "/dashboard" });
  },
  component: OwnerAdmin,
});

const SECTIONS = [
  { key: "overview", id: "owner-overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", id: "owner-users", label: "Users", icon: Users },
  { key: "keys", id: "owner-keys", label: "Activation keys", icon: KeyRound },
  { key: "audit", id: "owner-audit", label: "Audit log", icon: ClipboardList },
] as const;

const SECTION_IDS: Record<string, string> = {
  overview: "owner-overview",
  users: "owner-users",
  keys: "owner-keys",
  audit: "owner-audit",
  tournaments: "owner-overview",
  advertising: "owner-overview",
  health: "owner-overview",
};

function OwnerAdmin() {
  const [active, setActive] = useState<string>("overview");

  const scrollTo = (key: string) => {
    const id = SECTION_IDS[key] ?? "owner-overview";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const match = SECTIONS.find((s) => s.id === visible.target.id);
          if (match) setActive(match.key);
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Owner controls"
        description="Manage platform access, users and administration."
        action={
          <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Owner access
          </div>
        }
      />

      <nav
        aria-label="Owner sections"
        className="sticky top-16 z-20 -mx-2 overflow-x-auto rounded-xl border border-border/60 bg-background/85 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex min-w-max items-center gap-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => scrollTo(s.key)}
                aria-current={active === s.key ? "true" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active === s.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div id="owner-overview" className="scroll-mt-32 space-y-4">
        <OverviewPanel onNavigate={scrollTo} />
      </div>

      <div id="owner-users" className="scroll-mt-32">
        <UsersPanel />
      </div>

      <div id="owner-keys" className="scroll-mt-32">
        <KeysPanel />
      </div>

      <div id="owner-audit" className="scroll-mt-32">
        <AuditPanel />
      </div>
    </section>
  );
}
