import { supabase } from '@/integrations/supabase/client';

export const OWNER_EMAIL = 'maharjan.rohft@gmail.com';
export const ACTIVATION_PLANS = [
  { value: '1_day', label: '1 day trial' },
  { value: '1_month', label: '1 month' },
  { value: '6_months', label: '6 months' },
  { value: '1_year', label: '1 year' },
] as const;

export type AppAccess = {
  email: string;
  role: 'owner' | 'user';
  status: 'active' | 'suspended';
  activated_until: string | null;
};

export function hasAccess(profile: AppAccess | null) {
  if (!profile) return false;
  if (profile.role === 'owner' || profile.email.toLowerCase() === OWNER_EMAIL) return true;
  return profile.status === 'active' && !!profile.activated_until && new Date(profile.activated_until).getTime() > Date.now();
}

/**
 * Loads the access record without allowing a missing/unapplied migration to
 * crash the entire local app. The gate can still be shown and redeemed once
 * the database is configured.
 */
export async function getAppAccess(userId: string): Promise<AppAccess | null> {
  try {
    const ensured = await supabase.rpc('ensure_app_user');
    if (!ensured.error && ensured.data) {
      const row = ensured.data as unknown as AppAccess;
      return { email: row.email, role: row.role, status: row.status, activated_until: row.activated_until };
    }
    const { data, error } = await supabase
      .from('app_users')
      .select('email, role, status, activated_until')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Activation] Access table unavailable:', error.message);
      return null;
    }

    return (data ?? null) as AppAccess | null;
  } catch (error) {
    console.warn('[Activation] Access check unavailable:', error);
    return null;
  }
}
