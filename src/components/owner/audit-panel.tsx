import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuditLog } from "@/lib/owner";

export function AuditPanel() {
  const { data: entries = [], isLoading, error } = useAuditLog(200);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) =>
      `${e.action} ${e.actor_email ?? ""} ${e.target_label ?? ""}`.toLowerCase().includes(term),
    );
  }, [entries, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>
          Sensitive owner actions, newest first. Entries are append-only and readable by the owner
          alone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor or target"
            className="pl-9"
          />
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">Loading audit log…</p>}
        {error && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Unable to load audit log."}
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No recorded actions yet.</p>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-border/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="secondary">{entry.action}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-medium">{entry.actor_email || "system"}</span>
              {entry.target_label ? ` → ${entry.target_label}` : ""}
            </p>
            {(entry.before_value || entry.after_value) && (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {entry.before_value ? `before ${JSON.stringify(entry.before_value)} ` : ""}
                {entry.after_value ? `after ${JSON.stringify(entry.after_value)}` : ""}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
