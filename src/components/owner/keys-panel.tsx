import { useState } from "react";
import { Ban, Copy, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KEY_PLANS,
  useActivationKeys,
  useCreateKey,
  useDeleteKey,
  useRevokeKey,
} from "@/lib/owner";


function maskKey(key: string, reveal: boolean) {
  if (reveal) return key;
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

export function KeysPanel() {
  const { data: keys = [], isLoading } = useActivationKeys();
  const createKey = useCreateKey();
  const revokeKey = useRevokeKey();
  const deleteKey = useDeleteKey();


  const [plan, setPlan] = useState<string>("1_month");
  const [days, setDays] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [note, setNote] = useState("");
  const [generated, setGenerated] = useState("");

  const generate = async () => {
    try {
      const key = await createKey.mutateAsync({
        plan,
        days: plan === "custom" ? Number(days) || null : null,
        maxRedemptions: Math.max(1, Number(maxRedemptions) || 1),
        assignedEmail: assignedEmail.trim() || null,
        note: note.trim() || null,
      });
      setGenerated(key as string);
      toast.success("Activation key generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create key");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Generate activation key
          </CardTitle>
          <CardDescription>
            Choose a duration, optional assigned email, redemption limit and internal note.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Duration</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEY_PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {plan === "custom" && (
              <div>
                <Label htmlFor="key-days">Days</Label>
                <Input
                  id="key-days"
                  className="mt-2"
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="key-uses">Max redemptions</Label>
              <Input
                id="key-uses"
                className="mt-2"
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="key-email">Assigned email (optional)</Label>
              <Input
                id="key-email"
                className="mt-2"
                value={assignedEmail}
                onChange={(e) => setAssignedEmail(e.target.value)}
                placeholder="organizer@club.com"
              />
            </div>
            <div>
              <Label htmlFor="key-note">Internal note (optional)</Label>
              <Input
                id="key-note"
                className="mt-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void generate()} disabled={createKey.isPending}>
              {createKey.isPending ? "Generating…" : "Generate key"}
            </Button>
            {generated && (
              <Button
                variant="outline"
                className="font-mono"
                onClick={() => {
                  void navigator.clipboard.writeText(generated);
                  toast.success("Copied");
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> {generated}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activation key history</CardTitle>
          <CardDescription>
            Redeemed keys are masked. Unused keys can be revoked at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading keys…</p>}
          {!isLoading && keys.length === 0 && (
            <p className="text-sm text-muted-foreground">No keys generated yet.</p>
          )}
          {keys.map((k) => {
            const used = (k.redemption_count ?? 0) >= (k.max_redemptions ?? 1);
            const revoked = k.revoked === true;
            return (
              <div
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{maskKey(k.key, !used && !revoked)}</p>
                  <p className="text-xs text-muted-foreground">
                    {k.plan.replace("_", " ")} · {k.redemption_count ?? 0}/{k.max_redemptions ?? 1}{" "}
                    used · created {new Date(k.created_at).toLocaleDateString()}
                    {k.assigned_email ? ` · for ${k.assigned_email}` : ""}
                    {k.note ? ` · ${k.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={revoked ? "destructive" : used ? "secondary" : "default"}>
                    {revoked ? "Revoked" : used ? "Redeemed" : "Available"}
                  </Badge>
                  {!used && !revoked && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void navigator.clipboard.writeText(k.key);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void revokeKey
                            .mutateAsync(k.id)
                            .then(() => toast.success("Key revoked"))
                            .catch((err: Error) => toast.error(err.message));
                        }}
                      >
                        <Ban className="mr-1.5 h-4 w-4" /> Revoke
                      </Button>
                    </>
                  )}
                  {(k.redemption_count ?? 0) === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteKey.isPending}
                      onClick={() => {
                        if (!window.confirm("Permanently delete this activation key?")) return;
                        void deleteKey
                          .mutateAsync(k.id)
                          .then(() => toast.success("Key deleted"))
                          .catch((err: Error) => toast.error(err.message));
                      }}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
