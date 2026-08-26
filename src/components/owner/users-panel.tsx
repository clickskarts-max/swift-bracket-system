import { useMemo, useState } from "react";
import { CalendarClock, Infinity as InfinityIcon, Search, UserCheck, UserX } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  accessLabel,
  useOwnerUsers,
  useSetUserAccess,
  useSetUserStatus,
  type OwnerUser,
} from "@/lib/owner";

const PAGE_SIZE = 15;

function statusOf(user: OwnerUser) {
  if (user.role === "owner") return "owner";
  if (user.status === "suspended") return "suspended";
  if (!user.activated_until) return "not_activated";
  return new Date(user.activated_until).getTime() > Date.now() ? "active" : "expired";
}

export function UsersPanel() {
  const { data: users = [], isLoading, error } = useOwnerUsers();
  const setStatus = useSetUserStatus();
  const setAccess = useSetUserAccess();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [accessUser, setAccessUser] = useState<OwnerUser | null>(null);
  const [accessDate, setAccessDate] = useState("");
  const [confirm, setConfirm] = useState<OwnerUser | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (term && !u.email.toLowerCase().includes(term)) return false;
      if (filter === "all") return true;
      return statusOf(u) === filter;
    });
  }, [users, search, filter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const applyAccess = async (unlimited: boolean) => {
    if (!accessUser) return;
    try {
      await setAccess.mutateAsync({
        email: accessUser.email,
        unlimited,
        until: unlimited || !accessDate ? null : new Date(accessDate).toISOString(),
      });
      toast.success(`Access updated for ${accessUser.email}`);
      setAccessUser(null);
      setAccessDate("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const toggleStatus = async (user: OwnerUser) => {
    try {
      await setStatus.mutateAsync({
        email: user.email,
        status: user.status === "active" ? "suspended" : "active",
      });
      toast.success(`${user.email} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
    setConfirm(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Search, filter and manage platform access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by email"
              className="pl-9"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="not_activated">Not activated</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
        {error && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Unable to load users."}
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No users match this filter.</p>
        )}

        <div className="space-y-2">
          {current.map((user) => {
            const state = statusOf(user);
            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {accessLabel(user.activated_until)} · {user.tournament_count} tournaments ·
                    joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      state === "suspended" || state === "expired" ? "destructive" : "secondary"
                    }
                  >
                    {state.replace("_", " ")}
                  </Badge>
                  {user.role !== "owner" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAccessUser(user);
                          setAccessDate("");
                        }}
                      >
                        <CalendarClock className="mr-1.5 h-4 w-4" /> Access
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirm(user)}>
                        {user.status === "active" ? (
                          <>
                            <UserX className="mr-1.5 h-4 w-4" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1.5 h-4 w-4" /> Reactivate
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page + 1} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!accessUser} onOpenChange={(open) => !open && setAccessUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set access expiry</DialogTitle>
            <DialogDescription>{accessUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="access-date">Access until</Label>
            <Input
              id="access-date"
              type="date"
              value={accessDate}
              onChange={(e) => setAccessDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current: {accessLabel(accessUser?.activated_until ?? null)}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => void applyAccess(true)}>
              <InfinityIcon className="mr-1.5 h-4 w-4" /> Unlimited access
            </Button>
            <Button disabled={!accessDate} onClick={() => void applyAccess(false)}>
              Save expiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.status === "active" ? "Suspend this account?" : "Reactivate this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.status === "active"
                ? `${confirm?.email} will immediately lose access to the dashboard. Their tournaments and data stay intact and public pages keep working.`
                : `${confirm?.email} regains dashboard access, subject to their access expiry.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && void toggleStatus(confirm)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
