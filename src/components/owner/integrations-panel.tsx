import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Plug,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/owner/owner-ui";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderMeta,
  type IntegrationRow,
} from "@/lib/integrations/registry";
import {
  useDisconnectIntegration,
  useIntegrations,
  useRunIntegrationAction,
  useSaveIntegration,
  useSetIntegrationEnabled,
} from "@/lib/integrations/hooks";

function StatusPill({ row }: { row?: IntegrationRow | undefined }) {
  const status = row?.status ?? "disconnected";
  const map: Record<string, { label: string; className: string }> = {
    connected: { label: "Connected", className: "bg-emerald-500/15 text-emerald-500" },
    syncing: { label: "Syncing", className: "bg-amber-500/15 text-amber-500" },
    error: { label: "Error", className: "bg-destructive/15 text-destructive" },
    disconnected: { label: "Disconnected", className: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map["disconnected"]!;
  return <Badge className={`border-0 ${s.className}`}>{s.label}</Badge>;
}

function ProviderCard({
  meta,
  row,
}: {
  meta: IntegrationProviderMeta;
  row?: IntegrationRow | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, string>>(
    Object.fromEntries(
      meta.configFields.map((f) => [f.key, String((row?.config?.[f.key] as string) ?? "")]),
    ),
  );

  const save = useSaveIntegration();
  const toggle = useSetIntegrationEnabled();
  const run = useRunIntegrationAction();
  const disconnect = useDisconnectIntegration();

  const busy = save.isPending || run.isPending || disconnect.isPending;

  const onSave = async () => {
    const missing = meta.secretFields.filter(
      (f) => f.required && !secrets[f.key] && !row?.configured_secrets?.includes(f.key),
    );
    if (missing.length) {
      toast.error(`Please provide: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    try {
      await save.mutateAsync({
        provider: meta.id,
        displayName: meta.name,
        config,
        secrets,
      });
      setSecrets({});
      setOpen(false);
      toast.success(`${meta.name} saved.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save integration");
    }
  };

  const doRun = async (kind: "test" | "sync") => {
    if (!row) return;
    try {
      const res = (await run.mutateAsync({ integrationId: row.id, kind })) as {
        ok: boolean;
        message: string;
      };
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    }
  };

  return (
    <SectionCard
      title={meta.name}
      description={meta.description}
      action={
        row ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {row.enabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={row.enabled}
              disabled={toggle.isPending}
              onCheckedChange={(v) => toggle.mutate({ integrationId: row.id, enabled: v })}
            />
          </div>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plug className="mr-1 h-4 w-4" /> Connect
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <StatusPill row={row} />
          <span>{meta.category}</span>
          <span>Auth: {meta.authType.replace("_", " ")}</span>
          {row?.last_synced_at && (
            <span>Last synced {new Date(row.last_synced_at).toLocaleString()}</span>
          )}
          {row?.last_error && (
            <span className="flex items-center gap-1 text-destructive">
              <TriangleAlert className="h-3 w-3" /> {row.last_error}
            </span>
          )}
          {row && !row.last_error && row.status === "connected" && (
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3 w-3" /> Credentials stored
            </span>
          )}
        </div>

        {row && !open && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => doRun("test")}>
              {run.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Test connection
            </Button>
            {meta.supportsSync && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => doRun("sync")}>
                <RefreshCw className="mr-1 h-4 w-4" /> Sync now
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              Configure / Reconnect
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={busy}
              onClick={() => {
                if (!confirm(`Disconnect ${meta.name}? Stored credentials are deleted.`)) return;
                disconnect
                  .mutateAsync(row.id)
                  .then(() => toast.success(`${meta.name} disconnected.`))
                  .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"));
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Disconnect
            </Button>
          </div>
        )}

        {open && (
          <div className="space-y-3 rounded-lg border border-border/60 p-3">
            {meta.secretFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`${meta.id}-${f.key}`}>{f.label}</Label>
                <Input
                  id={`${meta.id}-${f.key}`}
                  type="password"
                  autoComplete="off"
                  placeholder={
                    row?.configured_secrets?.includes(f.key)
                      ? "•••••••• (leave blank to keep)"
                      : f.placeholder
                  }
                  value={secrets[f.key] ?? ""}
                  onChange={(e) => setSecrets((s) => ({ ...s, [f.key]: e.target.value }))}
                />
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
              </div>
            ))}
            {meta.configFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`${meta.id}-cfg-${f.key}`}>{f.label}</Label>
                <Input
                  id={`${meta.id}-cfg-${f.key}`}
                  placeholder={f.placeholder}
                  value={config[f.key] ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                />
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
              </div>
            ))}
            {meta.supportsInboundWebhook && row && (
              <p className="break-all text-xs text-muted-foreground">
                Inbound webhook URL:{" "}
                <code>
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /api/public/integrations/{meta.id}?integration_id={row.id}
                </code>
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={onSave}>
                {save.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Credentials are stored server-side and are never sent back to the browser.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export function IntegrationsPanel() {
  const { data = [], isLoading } = useIntegrations();
  const byProvider = useMemo(() => {
    const map: Record<string, IntegrationRow> = {};
    for (const row of data) map[row.provider] = row;
    return map;
  }, [data]);

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-muted/40" />;
  }

  return (
    <div className="space-y-4">
      {INTEGRATION_PROVIDERS.map((meta) => (
        <ProviderCard key={meta.id} meta={meta} row={byProvider[meta.id]} />
      ))}
    </div>
  );
}
