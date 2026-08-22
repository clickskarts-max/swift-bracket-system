import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app-shell";
import { Field } from "@/components/data-bits";
import { PasswordSecurity } from "@/components/password-security";
import { useAuth } from "@/hooks/use-auth";
import { OWNER_EMAIL } from "@/lib/activation";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization, useUpsert } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Organization settings — Ecluid Basketball" },
      {
        name: "description",
        content:
          "Set your organization name, logo, brand colors and contact details for public tournament pages.",
      },
      { property: "og:title", content: "Organization settings — Ecluid Basketball" },
      {
        property: "og:description",
        content: "Branding and contact details for your basketball organization.",
      },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Organization name is required").max(100),
  contact_email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
  website: z.string().trim().max(255),
});

type Draft = {
  id?: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  contact_email: string;
  contact_phone: string;
  website: string;
};

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: org } = useOrganization();
  const save = useUpsert("organizations", [["organization"]]);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    logo_url: null,
    primary_color: "#ff6b1a",
    accent_color: "#3ba9ff",
    contact_email: "",
    contact_phone: "",
    website: "",
  });

  useEffect(() => {
    if (org)
      setDraft({
        id: org.id,
        name: org.name,
        logo_url: org.logo_url,
        primary_color: org.primary_color ?? "#ff6b1a",
        accent_color: org.accent_color ?? "#3ba9ff",
        contact_email: org.contact_email ?? "",
        contact_phone: org.contact_phone ?? "",
        website: org.website ?? "",
      });
  }, [org]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    save.mutate(draft, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Branding used across your tournaments and public pages."
      />
      <div className="surface-card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organization name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Logo URL">
            <Input
              value={draft.logo_url ?? ""}
              onChange={(e) => set("logo_url", e.target.value || null)}
            />
          </Field>
          <Field label="Primary color">
            <Input
              type="color"
              className="h-10 p-1"
              value={draft.primary_color}
              onChange={(e) => set("primary_color", e.target.value)}
            />
          </Field>
          <Field label="Accent color">
            <Input
              type="color"
              className="h-10 p-1"
              value={draft.accent_color}
              onChange={(e) => set("accent_color", e.target.value)}
            />
          </Field>
          <Field label="Contact email">
            <Input
              type="email"
              value={draft.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
            />
          </Field>
          <Field label="Contact phone">
            <Input
              value={draft.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
            />
          </Field>
          <Field label="Website">
            <Input value={draft.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
        </div>
        <Button onClick={submit} disabled={save.isPending}>
          Save settings
        </Button>
      </div>

      {user?.email?.toLowerCase() === OWNER_EMAIL && (
        <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <div>
            <p className="text-sm font-semibold">Owner settings</p>
            <p className="text-sm text-muted-foreground">
              Generate activation keys and manage app users.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/owner" })}>
            Open owner dashboard
          </Button>
        </div>
      )}

      <PasswordSecurity user={user} />

      <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium">Signed in as</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
