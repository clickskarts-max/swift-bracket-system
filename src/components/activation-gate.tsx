import { useEffect, useState } from 'react';
import { Copy, KeyRound, LockKeyhole, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ACTIVATION_PLANS, OWNER_EMAIL, type AppAccess } from '@/lib/activation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ActivationGate({ profile, onActivated }: { profile: AppAccess; onActivated: () => void }) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const redeem = async () => {
    if (!key.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc('redeem_activation_key', { input_key: key.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('App activated successfully');
    onActivated();
  };
  return <main className="flex min-h-[70vh] items-center justify-center p-6">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center"><div className="mx-auto mb-3 rounded-2xl bg-primary/10 p-3 text-primary"><LockKeyhole className="mx-auto h-7 w-7" /></div><CardTitle>Activation required</CardTitle><CardDescription>Your account needs an activation key before you can use the app.</CardDescription></CardHeader>
      <CardContent className="space-y-4"><div><Label htmlFor="activation-key">Activation key</Label><Input id="activation-key" value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} placeholder="ECL-XXXXXXXXXXXXXXXXXXXX" className="mt-2 font-mono" /></div><Button className="w-full" onClick={redeem} disabled={busy}>{busy ? 'Activating…' : 'Activate app'}</Button><p className="text-center text-xs text-muted-foreground">Ask the owner at {OWNER_EMAIL} for a key.</p></CardContent>
    </Card>
  </main>;
}

export function OwnerPanel() {
  const [plan, setPlan] = useState<string>('1_day');
  const [generated, setGenerated] = useState('');
  const [users, setUsers] = useState<AppAccess[]>([]);
  const loadUsers = async () => { const { data } = await supabase.from('app_users').select('email, role, status, activated_until').order('created_at', { ascending: false }); setUsers((data ?? []) as AppAccess[]); };
  useEffect(() => { void loadUsers(); }, []);
  const createKey = async () => { const { data, error } = await supabase.rpc('owner_create_activation_key', { input_plan: plan }); if (error) { toast.error(error.message); return; } setGenerated(data ?? ''); toast.success('Activation key generated'); };
  const setStatus = async (email: string, status: 'active' | 'suspended') => { const { error } = await supabase.rpc('owner_set_user_status', { input_email: email, input_status: status }); if (error) { toast.error(error.message); return; } toast.success(`${email} is now ${status}`); await loadUsers(); };
  return <section className="space-y-6">
    <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><div><h2 className="font-display text-2xl font-semibold">Owner controls</h2><p className="text-sm text-muted-foreground">Generate keys and manage app access.</p></div></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Generate activation key</CardTitle><CardDescription>Each key can be redeemed once.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row"><Select value={plan} onValueChange={setPlan}><SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger><SelectContent>{ACTIVATION_PLANS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select><Button onClick={createKey}>Generate key</Button>{generated && <Button variant="outline" className="font-mono" onClick={() => { void navigator.clipboard.writeText(generated); toast.success('Copied'); }}><Copy className="mr-2 h-4 w-4" />{generated}</Button>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Users</CardTitle><CardDescription>Review account status and activation expiry.</CardDescription></CardHeader><CardContent><div className="space-y-3">{users.length === 0 ? <p className="text-sm text-muted-foreground">No users yet.</p> : users.map((user) => <div key={user.email} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{user.email}</p><p className="text-xs text-muted-foreground">{user.role === 'owner' ? 'Owner — unlimited access' : user.activated_until ? `Access until ${new Date(user.activated_until).toLocaleDateString()}` : 'Not activated'}</p></div><div className="flex items-center gap-2">{user.status === 'suspended' ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}<span className="text-sm capitalize">{user.status}</span>{user.role !== 'owner' && <Button size="sm" variant="outline" onClick={() => void setStatus(user.email, user.status === 'active' ? 'suspended' : 'active')}>{user.status === 'active' ? 'Suspend' : 'Reactivate'}</Button>}</div></div>)}</div></CardContent></Card>
  </section>;
}
