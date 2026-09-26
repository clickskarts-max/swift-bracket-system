import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { CopyLink, InviteDialog } from "@/components/access/invite-dialog";
import { AccessMatrix } from "@/components/access/access-matrix";
import { TOURNAMENT_ROLES, hasPermission, roleLabel, useInvalidateAccess } from "@/lib/permissions";
import { formatDate } from "@/lib/app";

type Access = {
  owner_id: string;
  members: { user_id: string; email: string | null; role: string; added_by: string | null }[];
  invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
    invited_by: string | null;
    expires_at: string;
  }[];
};

type Pending =
  | { kind: "role"; userId: string; email: string | null; from: string; to: string }
  | { kind: "remove"; userId: string; email: string | null }
  | null;

export function TournamentAccessTab({
  tournamentId,
  accountId,
  perms,
}: {
  tournamentId: string;
  accountId: string;
  perms: string[];
}) {
  const invalidate = useInvalidateAccess();
  const [pending, setPending] = useState<Pending>(null);
  const [resentToken, setResentToken] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["tournament-access", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_tournament_access", {
        _tournament_id: tournamentId,
      });
      if (error) throw new Error(error.message);
      return data as unknown as Access;
    },
  });

  const canInvite = hasPermission(perms, "users.invite");
  const canRoles = hasPermission(perms, "users.manage_roles");
  const canRemove = hasPermission(perms, "users.remove");

  const run = async (fn: PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn;
    if (error) return toast.error(error.message);
    toast.success(ok);
    invalidate();
  };

  const confirm = async () => {
    if (!pending) return;
    if (pending.kind === "role")
      await run(
        supabase.rpc("set_tournament_member_role", {
          _tournament_id: tournamentId,
          _user_id: pending.userId,
          _role: pending.to,
        }),
        "Role updated",
      );
    else
      await run(
        supabase.rpc("remove_tournament_member", {
          _tournament_id: tournamentId,
          _user_id: pending.userId,
        }),
        "Access removed",
      );
    setPending(null);
  };

  const resend = async (id: string) => {
    const { data, error } = await supabase.rpc("resend_invitation", { _id: id });
    if (error) return toast.error(error.message);
    setResentToken(data as string);
    invalidate();
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading access…</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">People with access</h3>
          <p className="text-xs text-muted-foreground">
            Roles here apply only to this tournament.
          </p>
        </div>
        {canInvite && <InviteDialog accountId={accountId} tournamentId={tournamentId} />}
      </div>

      {resentToken && <CopyLink token={resentToken} />}

      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.members.map((m) => {
              const isOwner = m.user_id === data.owner_id;
              return (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium">
                    {m.email ?? "—"} {isOwner && <Badge variant="outline">Owner</Badge>}
                  </TableCell>
                  <TableCell>
                    {canRoles && !isOwner ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          setPending({ kind: "role", userId: m.user_id, email: m.email, from: m.role, to: v })
                        }
                      >
                        <SelectTrigger className="h-8 w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOURNAMENT_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      roleLabel(m.role)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-success/40 text-success">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.added_by ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {canRemove && !isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setPending({ kind: "remove", userId: m.user_id, email: m.email })}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {data?.invitations.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.email}</TableCell>
                <TableCell>{roleLabel(i.role)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {i.status}
                  </Badge>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {i.status === "pending" ? `Expires ${formatDate(i.expires_at)}` : ""}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{i.invited_by ?? "—"}</TableCell>
                <TableCell className="space-x-1 text-right">
                  {canInvite && i.status !== "revoked" && (
                    <Button size="sm" variant="outline" onClick={() => resend(i.id)}>
                      Resend
                    </Button>
                  )}
                  {canInvite && i.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => run(supabase.rpc("revoke_invitation", { _id: i.id }), "Invitation revoked")}
                    >
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AccessMatrix />

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "role" ? "Change role?" : "Remove access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "role"
                ? `${pending.email ?? "This user"}: ${roleLabel(pending.from)} → ${roleLabel(pending.to)}. Takes effect immediately and only in this tournament.`
                : `${pending?.email ?? "This user"} will immediately lose access to this tournament. Their other tournaments and past records are not affected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
