import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Layers, Package, Save } from "lucide-react";
import { toast } from "sonner";
import {
  AdCampaign,
  AdCreative,
  useCampaignInventory,
  useSetCampaignInventory,
} from "@/lib/ads.functions";
import {
  CATEGORY_META,
  INVENTORY,
  INVENTORY_PACKAGES,
  type InventoryCategory,
  type InventoryDef,
} from "@/lib/ad-inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: InventoryCategory[] = ["sponsorship", "display", "native", "smart"];

/** Does the campaign have a creative able to fill this inventory item? */
const coverageFor = (def: InventoryDef, creatives: AdCreative[]) => {
  if (def.role === "sponsor_identity")
    return creatives.some((c) => c.creative_role === "sponsor_identity");
  if (def.role === "native") return creatives.some((c) => c.creative_role === "native");
  return creatives.some((c) => !c.creative_role || c.creative_role === "display");
};

export function InventoryManagement({
  campaign,
}: {
  campaign: AdCampaign & { ad_creatives: AdCreative[] };
}) {
  const { data: rows, isLoading } = useCampaignInventory(campaign.id);
  const save = useSetCampaignInventory();

  const [selected, setSelected] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (rows) {
      setSelected(rows.filter((r) => r.enabled !== false).map((r) => r.inventory_key));
      setDirty(false);
    }
  }, [rows]);

  const toggle = (key: string) => {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
    setDirty(true);
  };

  const applyPackage = (items: string[]) => {
    setSelected((s) => [...new Set([...s, ...items])]);
    setDirty(true);
  };

  const warnings = useMemo(
    () =>
      selected
        .map((key) => INVENTORY.find((i) => i.key === key))
        .filter((def): def is InventoryDef => !!def)
        .filter((def) => !coverageFor(def, campaign.ad_creatives)),
    [selected, campaign.ad_creatives],
  );

  const submit = async () => {
    try {
      await save.mutateAsync({ campaignId: campaign.id, inventoryKeys: selected });
      toast.success("Inventory updated");
      setDirty(false);
    } catch {
      toast.error("Failed to save inventory");
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold">
              <Package className="h-4 w-4 text-primary" /> Inventory packages
            </h3>
            <p className="text-xs text-muted-foreground">
              Quick-apply a bundle, then fine-tune the individual units below.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INVENTORY_PACKAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPackage(p.items)}
              className="rounded-lg border border-border/60 p-3 text-left transition-colors hover:border-primary/60 hover:bg-secondary/20"
            >
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{p.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.items.length} units
              </p>
            </button>
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium">Missing creatives for {warnings.length} selected unit(s)</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {warnings.map((w) => w.label).join(", ")} — add the matching creative type in the
              Creatives tab or these slots will stay empty.
            </p>
          </div>
        </div>
      )}

      {CATEGORY_ORDER.map((category) => {
        const items = INVENTORY.filter((i) => i.category === category);
        if (items.length === 0) return null;
        const meta = CATEGORY_META[category];
        return (
          <div key={category} className="surface-card rounded-xl border p-5">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Layers className="h-4 w-4 text-primary" /> {meta.label}
              </h3>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {items.map((def) => {
                const isOn = selected.includes(def.key);
                const covered = coverageFor(def, campaign.ad_creatives);
                return (
                  <label
                    key={def.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      isOn ? "border-primary/60 bg-primary/5" : "border-border/50 hover:bg-secondary/20",
                    )}
                  >
                    <Switch checked={isOn} onCheckedChange={() => toggle(def.key)} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium">{def.label}</span>
                        {def.exclusive && (
                          <Badge variant="outline" className="text-[9px] uppercase">
                            Exclusive
                          </Badge>
                        )}
                        {def.tournamentScoped && (
                          <Badge variant="secondary" className="text-[9px] uppercase">
                            Tournament
                          </Badge>
                        )}
                        {isOn &&
                          (covered ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500">
                              <Check className="h-3 w-3" /> ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500">
                              <AlertTriangle className="h-3 w-3" /> no creative
                            </span>
                          ))}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{def.description}</p>
                      {def.sizes && (
                        <p className="mt-1 text-[10px] text-muted-foreground">{def.sizes.join(" · ")}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isLoading
            ? "Loading inventory…"
            : selected.length === 0
              ? "No inventory selected — this campaign falls back to legacy placement rules."
              : `${selected.length} unit(s) assigned to this campaign.`}
        </p>
        <Button onClick={submit} disabled={!dirty || save.isPending}>
          <Save className="mr-1.5 h-4 w-4" /> Save inventory
        </Button>
      </div>
    </div>
  );
}
