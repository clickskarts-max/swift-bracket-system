import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import {
  Building2,
  Palette,
  Link2,
  Globe2,
  ShieldCheck,
  KeyRound,
  Loader2,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/app-shell";
import { PasswordSecurity } from "@/components/password-security";
import { ColorField } from "@/components/settings/color-field";
import { AssetField } from "@/components/settings/asset-field";
import { BrandPreview } from "@/components/settings/brand-preview";
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

const DEFAULTS = { primary: "#ff6b1a", secondary: "#1e1e1e", accent: "#3ba9ff" };

const schema = z.object({
  name: z.string().trim().min(2, "Organization name is required").max(100),
  brand_name: z.string().trim().max(100).optional(),
  short_name: z.string().trim().max(50).optional(),
  logo_url: z.string().trim().max(255).or(z.literal("")).nullable(),
  logo_dark_url: z.string().trim().max(255).or(z.literal("")).nullable(),
  favicon_url: z.string().trim().max(255).or(z.literal("")).nullable(),
  primary_color: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Primary color must be a valid HEX color"),
  secondary_color: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color")
    .optional(),
  accent_color: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Accent color must be a valid HEX color"),
  contact_email: z.string().trim().email("Please enter a valid email address.").max(255).or(z.literal("")),
  contact_phone: z.string().trim().max(20).optional(),
  website: z.string().trim().max(255).optional(),
  custom_domain: z.string().trim().max(255).optional(),
  footer_text: z.string().trim().max(255).optional(),
  powered_by_enabled: z.boolean().default(true),
  show_logo_public: z.boolean().default(true),
  show_name_public: z.boolean().default(true),
  show_contact_public: z.boolean().default(false),
});

type Draft = z.infer<typeof schema> & { id?: string };

const EMPTY: Draft = {
  name: "",
  brand_name: "",
  short_name: "",
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: DEFAULTS.primary,
  secondary_color: DEFAULTS.secondary,
  accent_color: DEFAULTS.accent,
  contact_email: "",
  contact_phone: "",
  website: "",
  custom_domain: "",
  footer_text: "",
  powered_by_enabled: true,
  show_logo_public: true,
  show_name_public: true,
  show_contact_public: false,
};

type OrgRow = Record<string, unknown> & { id: string; name: string };

const toDraft = (org: OrgRow): Draft => ({
  ...EMPTY,
  id: org.id,
  name: org.name,
  brand_name: (org["brand_name"] as string) ?? "",
  short_name: (org["short_name"] as string) ?? "",
  logo_url: (org["logo_url"] as string) ?? null,
  logo_dark_url: (org["logo_dark_url"] as string) ?? null,
  favicon_url: (org["favicon_url"] as string) ?? null,
  primary_color: (org["primary_color"] as string) ?? DEFAULTS.primary,
  secondary_color: (org["secondary_color"] as string) ?? DEFAULTS.secondary,
  accent_color: (org["accent_color"] as string) ?? DEFAULTS.accent,
  contact_email: (org["contact_email"] as string) ?? "",
  contact_phone: (org["contact_phone"] as string) ?? "",
  website: (org["website"] as string) ?? "",
  custom_domain: (org["custom_domain"] as string) ?? "",
  footer_text: (org["footer_text"] as string) ?? "",
  powered_by_enabled: (org["powered_by_enabled"] as boolean) ?? true,
  show_logo_public: (org["show_logo_public"] as boolean) ?? true,
  show_name_public: (org["show_name_public"] as boolean) ?? true,
  show_contact_public: (org["show_contact_public"] as boolean) ?? false,
});

const SECTIONS = [
  { value: "general", label: "General", icon: Building2, group: "Organization" },
  { value: "branding", label: "Branding", icon: Palette, group: "Organization" },
  { value: "contact", label: "Contact & links", icon: Link2, group: "Organization" },
  { value: "public", label: "Public pages", icon: Globe2, group: "Organization" },
  { value: "security", label: "Security", icon: KeyRound, group: "Account" },
] as const;

type SectionValue = (typeof SECTIONS)[number]["value"] | "owner";

function FieldRow({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: org, isLoading } = useOrganization();
  const save = useUpsert("organizations", [["organization"], ["branding"]]);

  const [section, setSection] = useState<SectionValue>("general");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<Draft>(EMPTY);
  const [resetOpen, setResetOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL;

  useEffect(() => {
    if (org) {
      const next = toDraft(org as unknown as OrgRow);
      setDraft(next);
      setSaved(next);
    }
  }, [org]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const issues = useMemo(() => {
    const parsed = schema.safeParse(draft);
    if (parsed.success) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !map[key]) map[key] = issue.message;
    }
    return map;
  }, [draft]);

  const normalizeWebsite = () => {
    const raw = (draft.website ?? "").trim();
    if (!raw) return;
    if (!/^https?:\/\//i.test(raw)) set("website", `https://${raw}`);
  };

  const submit = () => {
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "Check the highlighted fields");
      return;
    }
    save.mutate(draft, {
      onSuccess: () => {
        setSaved(draft);
        toast.success("Organization settings saved");
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const discard = () => {
    setDraft(saved);
    setDiscardOpen(false);
  };

  const resetBranding = () => {
    setDraft((d) => ({
      ...d,
      logo_url: null,
      logo_dark_url: null,
      favicon_url: null,
      primary_color: DEFAULTS.primary,
      secondary_color: DEFAULTS.secondary,
      accent_color: DEFAULTS.accent,
    }));
    setResetOpen(false);
    toast.info("Platform defaults loaded — save to apply.");
  };

  const sendReset = async () => {
    if (!user?.email || sendingReset) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setSendingReset(false);
    if (error) toast.error("We couldn't send the reset email. Try again shortly.");
    else toast.success("Password reset email sent.");
  };

  const preview = {
    displayName: draft.brand_name || draft.name,
    logoUrl: draft.logo_url,
    faviconUrl: draft.favicon_url,
    primary: draft.primary_color,
    accent: draft.accent_color,
    footerText: draft.footer_text ?? "",
    poweredBy: draft.powered_by_enabled,
    showLogo: draft.show_logo_public,
    showName: draft.show_name_public,
    showContact: draft.show_contact_public,
    contactEmail: draft.contact_email,
    contactPhone: draft.contact_phone ?? "",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Settings" description="Organization identity, branding and account security." />
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-96 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Settings" description="Organization identity, branding and account security." />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Settings navigation */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {["Organization", "Account"].map((group) => (
              <div key={group} className="contents lg:block lg:space-y-1">
                <p className="hidden px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:block">
                  {group}
                </p>
                {SECTIONS.filter((s) => s.group === group).map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSection(s.value)}
                    aria-current={section === s.value ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full ${
                      section === s.value
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <s.icon className="h-4 w-4 shrink-0" />
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
            {isOwner && (
              <button
                type="button"
                onClick={() => setSection("owner")}
                aria-current={section === "owner" ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:mt-1 lg:w-full ${
                  section === "owner"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Owner dashboard
              </button>
            )}
          </div>
        </nav>

        {/* Section content */}
        <div className="min-w-0 space-y-6">
          {section === "general" && (
            <section className="surface-card space-y-5 p-5">
              <header>
                <h2 className="text-base font-semibold">Organization profile</h2>
                <p className="text-sm text-muted-foreground">
                  Identity used across the dashboard and your public tournament pages.
                </p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow
                  id="org-name"
                  label="Organization name"
                  hint="Used internally to identify this organization."
                  error={issues["name"]}
                >
                  <Input id="org-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
                </FieldRow>
                <FieldRow
                  id="brand-name"
                  label="Public display name"
                  hint="Displayed to visitors on public tournament pages."
                >
                  <Input
                    id="brand-name"
                    value={draft.brand_name || ""}
                    onChange={(e) => set("brand_name", e.target.value)}
                    placeholder="e.g. Kirtipur Basketball Association"
                  />
                </FieldRow>
                <FieldRow id="short-name" label="Short name" hint="Compact label used where space is tight.">
                  <Input
                    id="short-name"
                    value={draft.short_name || ""}
                    onChange={(e) => set("short_name", e.target.value)}
                    placeholder="e.g. KBA"
                  />
                </FieldRow>
              </div>
            </section>
          )}

          {section === "branding" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="surface-card space-y-4 p-5">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Logos & favicon</h2>
                      <p className="text-sm text-muted-foreground">
                        Upload image files — no links needed.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to platform defaults
                    </Button>
                  </header>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AssetField
                      id="logo-light"
                      label="Logo for light backgrounds"
                      hint="Shown on light surfaces and public pages."
                      requirements="PNG or SVG, at least 240×80 px, under 5 MB."
                      value={draft.logo_url}
                      onChange={(url) => set("logo_url", url)}
                      folder="branding"
                    />
                    <AssetField
                      id="logo-dark"
                      label="Logo for dark backgrounds"
                      hint="Optional — leave empty to reuse the light logo."
                      requirements="Same size guidance as the light logo."
                      value={draft.logo_dark_url}
                      onChange={(url) => set("logo_dark_url", url)}
                      folder="branding"
                      dark
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                    <div className="min-w-0">
                      <Label htmlFor="same-logo" className="text-sm font-medium">
                        Use light logo for both
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Clears the dark version so one logo is used everywhere.
                      </p>
                    </div>
                    <Switch
                      id="same-logo"
                      checked={!draft.logo_dark_url}
                      onCheckedChange={(v) => set("logo_dark_url", v ? null : draft.logo_url)}
                      className="shrink-0"
                    />
                  </div>

                  <AssetField
                    id="favicon"
                    label="Organization favicon"
                    hint="Used in browser tabs and branded public pages where supported."
                    requirements="Square PNG, 64×64 px or larger."
                    value={draft.favicon_url}
                    onChange={(url) => set("favicon_url", url)}
                    folder="branding"
                    square
                  />
                </section>

                <section className="surface-card space-y-4 p-5">
                  <header>
                    <h2 className="text-base font-semibold">Brand colors</h2>
                    <p className="text-sm text-muted-foreground">
                      Applied to buttons, highlights and public page accents.
                    </p>
                  </header>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField
                      id="primary-color"
                      label="Primary color"
                      value={draft.primary_color}
                      fallback={DEFAULTS.primary}
                      onChange={(v) => set("primary_color", v)}
                    />
                    <ColorField
                      id="accent-color"
                      label="Accent color"
                      value={draft.accent_color}
                      fallback={DEFAULTS.accent}
                      onChange={(v) => set("accent_color", v)}
                    />
                  </div>
                </section>
              </div>

              <aside className="xl:sticky xl:top-20 xl:self-start">
                <BrandPreview data={preview} />
              </aside>
            </div>
          )}

          {section === "contact" && (
            <div className="space-y-6">
              <section className="surface-card space-y-4 p-5">
                <header>
                  <h2 className="text-base font-semibold">Contact & links</h2>
                  <p className="text-sm text-muted-foreground">
                    This information appears on public pages when contact visibility is enabled.
                  </p>
                </header>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow
                    id="contact-email"
                    label="Contact email"
                    hint="Used for enquiries from public pages."
                    error={issues["contact_email"]}
                  >
                    <Input
                      id="contact-email"
                      type="email"
                      value={draft.contact_email}
                      onChange={(e) => set("contact_email", e.target.value)}
                    />
                  </FieldRow>
                  <FieldRow id="contact-phone" label="Contact phone" hint="Optional.">
                    <Input
                      id="contact-phone"
                      value={draft.contact_phone || ""}
                      onChange={(e) => set("contact_phone", e.target.value)}
                    />
                  </FieldRow>
                  <FieldRow id="website" label="Website" hint="https:// is added automatically if missing.">
                    <Input
                      id="website"
                      value={draft.website || ""}
                      onChange={(e) => set("website", e.target.value)}
                      onBlur={normalizeWebsite}
                      placeholder="yourclub.com"
                    />
                  </FieldRow>
                </div>
              </section>

              <section className="surface-card space-y-3 p-5">
                <header>
                  <h2 className="text-base font-semibold">Custom domain</h2>
                  <p className="text-sm text-muted-foreground">
                    Custom domains are not currently configured for this workspace. Saving a domain here
                    stores it for future use — it does not connect DNS yet.
                  </p>
                </header>
                <FieldRow
                  id="custom-domain"
                  label="Domain"
                  hint="Example: basketball.client-a.com"
                >
                  <Input
                    id="custom-domain"
                    value={draft.custom_domain || ""}
                    onChange={(e) => set("custom_domain", e.target.value)}
                    placeholder="basketball.client-a.com"
                  />
                </FieldRow>
                <p className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <Globe2 className="h-3.5 w-3.5 shrink-0" />
                  Status: not connected — domain verification isn't available yet.
                </p>
              </section>
            </div>
          )}

          {section === "public" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="surface-card space-y-2 p-5">
                <header className="pb-2">
                  <h2 className="text-base font-semibold">Public page branding</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose what visitors see on your public tournament pages.
                  </p>
                </header>
                <ToggleRow
                  id="show-logo"
                  label="Show organization logo"
                  hint="Displays your logo in the public page header."
                  checked={draft.show_logo_public}
                  onChange={(v) => set("show_logo_public", v)}
                />
                <ToggleRow
                  id="show-name"
                  label="Show organization name"
                  hint="Displays your public display name beside the tournament title."
                  checked={draft.show_name_public}
                  onChange={(v) => set("show_name_public", v)}
                />
                <ToggleRow
                  id="show-powered"
                  label='Show "Powered by" branding'
                  hint="Adds a small Ecluid Basketball credit in the footer."
                  checked={draft.powered_by_enabled}
                  onChange={(v) => set("powered_by_enabled", v)}
                />
                <ToggleRow
                  id="show-contact"
                  label="Show contact information"
                  hint="Adds your contact email and phone to the public footer."
                  checked={draft.show_contact_public}
                  onChange={(v) => set("show_contact_public", v)}
                />
                <div className="pt-3">
                  <FieldRow
                    id="footer-text"
                    label="Custom footer text"
                    hint={`Appears at the bottom of public pages · ${(draft.footer_text ?? "").length}/255`}
                  >
                    <Input
                      id="footer-text"
                      maxLength={255}
                      value={draft.footer_text || ""}
                      onChange={(e) => set("footer_text", e.target.value)}
                      placeholder="© 2026 Kirtipur Basketball Association"
                    />
                  </FieldRow>
                </div>
              </section>

              <aside className="xl:sticky xl:top-20 xl:self-start">
                <BrandPreview data={preview} />
              </aside>
            </div>
          )}

          {section === "security" && (
            <div className="space-y-6">
              <PasswordSecurity user={user} />

              <section className="surface-card space-y-3 p-5">
                <div>
                  <h2 className="text-base font-semibold">Forgot your password?</h2>
                  <p className="text-sm text-muted-foreground">
                    We'll email a secure reset link to {user?.email}.
                  </p>
                </div>
                <Button variant="outline" onClick={sendReset} disabled={sendingReset}>
                  {sendingReset && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  {sendingReset ? "Sending…" : "Send password reset email"}
                </Button>
              </section>

              <section className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
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
              </section>
            </div>
          )}

          {section === "owner" && isOwner && (
            <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Platform owner</p>
                  <p className="text-sm text-muted-foreground">
                    Manage platform-wide users, access, tournaments, sponsors, advertising and system
                    administration.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({ to: "/owner", search: { section: "dashboard", tab: undefined } })
                }
              >
                Open owner dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </section>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && section !== "security" && section !== "owner" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-medium">You have unsaved changes</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setDiscardOpen(true)} disabled={save.isPending}>
                Discard
              </Button>
              <Button onClick={submit} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset branding to platform defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              Logos, favicon and colors return to the Ecluid defaults in this form. Nothing is saved until
              you choose Save changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my branding</AlertDialogCancel>
            <AlertDialogAction onClick={resetBranding}>Load defaults</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your edits will be replaced with the last saved settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={discard}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
