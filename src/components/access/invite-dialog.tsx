import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/data-bits";
import { ACCOUNT_ROLES, TOURNAMENT_ROLES, inviteLink, useInvalidateAccess } from "@/lib/permissions";

export function CopyLink({ token }: { token: string }) {
  const link = inviteLink(token);
  return (
    <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
      <p className="text-xs text-muted-foreground">
        Share this one-time link with the person. It works only for their email address.
      </p>
      <div className="flex gap-2">
        <Input readOnly value={link} className="text-xs" onFocus={(e) => e.target.select()} />
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Copy invite link"
          onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function InviteDialog({
  accountId,
  tournamentId,
  tournaments = [],
  canInviteAdmins = false,
}: {
  accountId: string;
  /** Fixed tournament (tournament → Access). Omit for workspace-level invites. */
  tournamentId?: string;
  /** Optional tournament picker for workspace-level invites. */
  tournaments?: { id: string; name: string }[];
  canInviteAdmins?: boolean;
}) {
  const invalidate = useInvalidateAccess();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState<string>(tournamentId ?? "workspace");
  const [role, setRole] = useState<string>(tournamentId ? "scorekeeper" : "account_member");
  const [days, setDays] = useState(7);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const isTournament = target !== "workspace";
  const roles = isTournament
    ? TOURNAMENT_ROLES
    : ACCOUNT_ROLES.filter((r) => r.value !== "account_owner" && (canInviteAdmins || r.value !== "account_admin"));

  const reset = () => {
    setEmail("");
    setMessage("");
    setToken(null);
  };

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("create_invitation", {
      _account_id: accountId,
      _tournament_id: (isTournament ? target : null) as string,
      _email: email,
      _role: role,
      _days: days,
      _message: message,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    const res = data as { status: string; token: string | null };
    invalidate();
    if (res.status === "added") {
      toast.success("This person already has an account — access granted right away.");
      setOpen(false);
      reset();
    } else {
      setToken(res.token);
      toast.success("Invitation created");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tournamentId ? "Invite to tournament" : "Invite someone"}</DialogTitle>
        </DialogHeader>
        {token ? (
          <div className="space-y-3">
            <CopyLink token={token} />
            <Button className="w-full" variant="outline" onClick={reset}>
              Invite another person
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            {!tournamentId && (
              <Field label="Access to">
                <Select
                  value={target}
                  onValueChange={(v) => {
                    setTarget(v);
                    setRole(v === "workspace" ? "account_member" : "scorekeeper");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workspace">Whole workspace</SelectItem>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        Tournament: {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Role" hint={roles.find((r) => r.value === role)?.hint}>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Link expires after">
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 7, 14, 30].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} day{d > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Message (optional)">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
            </Field>
            <Button className="w-full" disabled={busy || !email} onClick={submit}>
              {busy ? "Sending…" : "Create invitation"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
