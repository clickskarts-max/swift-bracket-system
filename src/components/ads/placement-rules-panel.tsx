/**
 * Owner control surface for public tournament ad placements.
 * Per tab: on/off, top/inline/bottom units, frequency and max ad count.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdSettings, useUpdateAdSettings } from "@/lib/ads.functions";
import {
  PUBLIC_TABS,
  resolveAllRules,
  type PublicTabKey,
  type SlotRules,
  type TabPlacementRule,
} from "@/lib/ad-placement-rules";

const toggles: { key: keyof TabPlacementRule; label: string; inlineOnly?: boolean }[] = [
  { key: "top", label: "Top banner" },
  { key: "inline", label: "In-content", inlineOnly: true },
  { key: "bottom", label: "Bottom banner" },
  { key: "native", label: "Native card" },
  { key: "sponsor", label: "Sponsor strip" },
];

export function PlacementRulesPanel() {
  const { data: settings } = useAdSettings();
  const update = useUpdateAdSettings();
  const [draft, setDraft] = useState<SlotRules | null>(null);

  const stored = (settings?.slot_rules ?? {}) as SlotRules;
  const effective = useMemo(() => resolveAllRules(draft ?? stored), [draft, stored]);
  const dirty = draft !== null;

  const patch = (tab: PublicTabKey, values: Partial<TabPlacementRule>) => {
    setDraft((prev) => {
      const base = prev ?? stored;
      return { ...base, [tab]: { ...effective[tab], ...values } };
    });
  };

  const save = () => {
    if (!draft) return;
    const full = resolveAllRules(draft);
    update.mutate(
      { slot_rules: full },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success("Placement rules saved");
        },
        onError: () => toast.error("Could not save placement rules"),
      },
    );
  };

  return (
    <div className="surface-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Public page placements</h3>
          <p className="text-sm text-muted-foreground">
            Choose exactly where ads appear on each public tournament tab and how many run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              Reset
            </Button>
          )}
          <Button size="sm" disabled={!dirty || update.isPending} onClick={save}>
            {update.isPending ? "Saving…" : "Save placements"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {PUBLIC_TABS.map((tab) => {
          const rule = effective[tab.key];
          return (
            <div key={tab.key} className="rounded-lg border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tab.label}</span>
                  <Badge variant={rule.enabled ? "default" : "secondary"} className="text-[10px]">
                    {rule.enabled ? `Max ${rule.max}` : "Off"}
                  </Badge>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(v) => patch(tab.key, { enabled: v })}
                />
              </div>

              {rule.enabled && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {toggles
                      .filter((t) => !t.inlineOnly || tab.supportsInline)
                      .map((t) => (
                        <label
                          key={String(t.key)}
                          className="flex items-center justify-between gap-2 rounded-md bg-secondary/20 px-3 py-2 text-sm"
                        >
                          <span>{t.label}</span>
                          <Switch
                            checked={Boolean(rule[t.key])}
                            onCheckedChange={(v) => patch(tab.key, { [t.key]: v })}
                          />
                        </label>
                      ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {tab.supportsInline && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Show in-content ad every N items</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={rule.interval}
                          onChange={(e) =>
                            patch(tab.key, {
                              interval: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max ads on this tab</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={rule.max}
                        onChange={(e) =>
                          patch(tab.key, { max: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
