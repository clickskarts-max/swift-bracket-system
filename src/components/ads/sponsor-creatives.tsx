import { useState } from "react";
import { Plus, Trash2, Pencil, Award, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  AdCampaign,
  AdCreative,
  useCreateAdCreative,
  useUpdateAdCreative,
  useDeleteAdCreative,
} from "@/lib/ads.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/image-upload";

type Role = "sponsor_identity" | "native";

type Draft = {
  id?: string;
  name: string;
  sponsor_name: string;
  sponsor_label: string;
  media_url: string;
  logo_dark_url: string;
  alt_text: string;
  destination_url: string;
  headline: string;
  body_text: string;
  cta_label: string;
};

const blank = (): Draft => ({
  name: "",
  sponsor_name: "",
  sponsor_label: "",
  media_url: "",
  logo_dark_url: "",
  alt_text: "",
  destination_url: "",
  headline: "",
  body_text: "",
  cta_label: "Learn more",
});

export function SponsorCreatives({
  campaign,
}: {
  campaign: AdCampaign & { ad_creatives: AdCreative[] };
}) {
  const create = useCreateAdCreative();
  const update = useUpdateAdCreative();
  const remove = useDeleteAdCreative();

  const [role, setRole] = useState<Role>("sponsor_identity");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank());

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const sponsorIdentities = campaign.ad_creatives.filter(
    (c) => c.creative_role === "sponsor_identity",
  );
  const natives = campaign.ad_creatives.filter((c) => c.creative_role === "native");

  const startNew = (r: Role) => {
    setRole(r);
    setDraft(blank());
    setOpen(true);
  };

  const startEdit = (c: AdCreative) => {
    setRole(c.creative_role === "native" ? "native" : "sponsor_identity");
    setDraft({
      id: c.id,
      name: c.name,
      sponsor_name: c.sponsor_name ?? "",
      sponsor_label: c.sponsor_label ?? "",
      media_url: c.media_url ?? "",
      logo_dark_url: c.logo_dark_url ?? "",
      alt_text: c.alt_text ?? "",
      destination_url: c.destination_url ?? "",
      headline: c.headline ?? "",
      body_text: c.body_text ?? "",
      cta_label: c.cta_label ?? "Learn more",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!draft.media_url) {
      toast.error(role === "native" ? "Add an image or logo" : "Upload a sponsor logo");
      return;
    }
    if (draft.destination_url && !/^https:\/\//i.test(draft.destination_url)) {
      toast.error("Destination URL must start with https://");
      return;
    }
    const payload: Partial<AdCreative> = {
      campaign_id: campaign.id,
      creative_role: role,
      type: "image",
      provider_type: "direct",
      status: "active",
      is_responsive: true,
      name:
        draft.name ||
        draft.sponsor_name ||
        (role === "native" ? "Sponsored card" : "Sponsor identity"),
      sponsor_name: draft.sponsor_name || null,
      sponsor_label: draft.sponsor_label || null,
      media_url: draft.media_url,
      logo_dark_url: draft.logo_dark_url || null,
      alt_text: draft.alt_text || null,
      destination_url: draft.destination_url || null,
      headline: role === "native" ? draft.headline || null : null,
      body_text: role === "native" ? draft.body_text || null : null,
      cta_label: role === "native" ? draft.cta_label || null : null,
    };

    try {
      if (draft.id) {
        await update.mutateAsync({ id: draft.id, ...payload });
        toast.success("Creative updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Creative added");
      }
      setOpen(false);
      setDraft(blank());
    } catch {
      toast.error("Failed to save creative");
    }
  };

  const Row = ({ c }: { c: AdCreative }) => (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
      {c.media_url && (
        <img
          src={c.media_url}
          alt={c.alt_text || c.name}
          className="h-10 w-16 shrink-0 object-contain"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{c.headline || c.sponsor_name || c.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {c.creative_role === "native"
            ? c.body_text || "Sponsored card"
            : c.sponsor_label || "Sponsor identity"}
        </p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => remove.mutate(c.id, { onSuccess: () => toast.success("Creative removed") })}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="surface-card space-y-3 rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Award className="h-4 w-4 text-primary" /> Sponsor Identity
          </h3>
          <Button size="sm" variant="outline" onClick={() => startNew("sponsor_identity")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Logo lockup used by every sponsorship placement. No banner sizes required.
        </p>
        {sponsorIdentities.length === 0 ? (
          <Badge variant="secondary" className="text-[10px]">
            None yet
          </Badge>
        ) : (
          <div className="space-y-2">
            {sponsorIdentities.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>

      <div className="surface-card space-y-3 rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Megaphone className="h-4 w-4 text-primary" /> Native Sponsored Card
          </h3>
          <Button size="sm" variant="outline" onClick={() => startNew("native")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Editorial-style card, always labelled “Sponsored” on public pages.
        </p>
        {natives.length === 0 ? (
          <Badge variant="secondary" className="text-[10px]">
            None yet
          </Badge>
        ) : (
          <div className="space-y-2">
            {natives.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {draft.id ? "Edit" : "Add"}{" "}
              {role === "native" ? "sponsored card" : "sponsor identity"}
            </DialogTitle>
            <DialogDescription>
              {role === "native"
                ? "Shown between major sections with a clear Sponsored label."
                : "Used for Presented By, Official Partner and every other sponsorship slot."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Sponsor / advertiser name</Label>
              <Input
                value={draft.sponsor_name}
                onChange={(e) => set("sponsor_name", e.target.value)}
                placeholder="e.g. Milestone"
              />
            </div>

            {role === "sponsor_identity" ? (
              <div className="grid gap-2">
                <Label>Relationship label (optional)</Label>
                <Input
                  value={draft.sponsor_label}
                  onChange={(e) => set("sponsor_label", e.target.value)}
                  placeholder="Defaults to the inventory label, e.g. Presented by"
                />
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Headline</Label>
                  <Input
                    value={draft.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    placeholder="Build your game with Milestone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Short description</Label>
                  <Textarea
                    rows={2}
                    value={draft.body_text}
                    onChange={(e) => set("body_text", e.target.value)}
                    placeholder="Supporting the next generation of basketball."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>CTA label</Label>
                  <Input
                    value={draft.cta_label}
                    onChange={(e) => set("cta_label", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>{role === "native" ? "Image or logo" : "Sponsor logo"}</Label>
              <ImageUpload
                value={draft.media_url || null}
                onChange={(url) => set("media_url", url ?? "")}
                folder="ads"
              />
              <p className="text-[11px] text-muted-foreground">
                PNG or WebP with transparency preferred. Logos are never stretched.
              </p>
            </div>

            {role === "sponsor_identity" && (
              <div className="grid gap-2">
                <Label>Dark background version (optional)</Label>
                <ImageUpload
                  value={draft.logo_dark_url || null}
                  onChange={(url) => set("logo_dark_url", url ?? "")}
                  folder="ads"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Alt text</Label>
              <Input value={draft.alt_text} onChange={(e) => set("alt_text", e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Destination URL (optional)</Label>
              <Input
                value={draft.destination_url}
                onChange={(e) => set("destination_url", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              Save creative
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
