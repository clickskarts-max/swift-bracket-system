-- =========================================================
-- Phase 1: Platform Administration Center (additive only)
-- =========================================================

-- 1) AUDIT LOG -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read audit log" ON public.audit_log;
CREATE POLICY "Owner can read audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_app_owner());

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log (action);

-- helper used by security-definer owner functions
CREATE OR REPLACE FUNCTION public.log_owner_action(
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id text DEFAULT NULL,
  p_target_label text DEFAULT NULL,
  p_before jsonb DEFAULT NULL,
  p_after jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, target_id, target_label, before_value, after_value)
  VALUES (auth.uid(), coalesce(auth.jwt() ->> 'email', ''), p_action, p_target_type, p_target_id, p_target_label, p_before, p_after);
END; $$;

REVOKE EXECUTE ON FUNCTION public.log_owner_action(text,text,text,text,jsonb,jsonb) FROM public, anon, authenticated;

-- 2) ACTIVATION KEYS: additive columns -------------------------
ALTER TABLE public.activation_keys
  ADD COLUMN IF NOT EXISTS max_redemptions integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS redemption_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_email text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS duration_days integer;

-- backfill redemption_count for already redeemed keys (no data loss)
UPDATE public.activation_keys SET redemption_count = 1
  WHERE redeemed_by IS NOT NULL AND redemption_count = 0;

DROP POLICY IF EXISTS "Owner can read activation keys" ON public.activation_keys;
CREATE POLICY "Owner can read activation keys"
  ON public.activation_keys FOR SELECT TO authenticated
  USING (public.is_app_owner());

-- 3) ADVANCED KEY CREATION -------------------------------------
CREATE OR REPLACE FUNCTION public.owner_create_key(
  input_plan text,
  input_days integer DEFAULT NULL,
  input_max_redemptions integer DEFAULT 1,
  input_assigned_email text DEFAULT NULL,
  input_note text DEFAULT NULL,
  input_expires_at timestamptz DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_key text; days integer;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can generate keys'; END IF;
  IF input_plan NOT IN ('1_day','7_days','1_month','90_days','6_months','1_year','lifetime','custom') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;
  days := CASE input_plan
    WHEN '1_day' THEN 1
    WHEN '7_days' THEN 7
    WHEN '1_month' THEN 30
    WHEN '90_days' THEN 90
    WHEN '6_months' THEN 182
    WHEN '1_year' THEN 365
    WHEN 'lifetime' THEN NULL
    ELSE input_days END;
  IF input_plan = 'custom' AND (days IS NULL OR days < 1) THEN
    RAISE EXCEPTION 'Custom plans need a duration in days';
  END IF;

  new_key := 'ECL-' || upper(replace(gen_random_uuid()::text, '-', ''));
  INSERT INTO public.activation_keys (key, plan, duration_days, max_redemptions, assigned_email, note, expires_at, created_by)
  VALUES (new_key, input_plan, days, greatest(coalesce(input_max_redemptions,1),1),
          nullif(lower(trim(coalesce(input_assigned_email,''))),''), nullif(trim(coalesce(input_note,'')),''),
          input_expires_at, auth.uid());

  PERFORM public.log_owner_action('activation_key.created','activation_key',NULL,left(new_key,12) || '…',
    NULL, jsonb_build_object('plan',input_plan,'duration_days',days,'max_redemptions',greatest(coalesce(input_max_redemptions,1),1)));
  RETURN new_key;
END; $$;

REVOKE EXECUTE ON FUNCTION public.owner_create_key(text,integer,integer,text,text,timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_create_key(text,integer,integer,text,text,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_revoke_activation_key(input_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec public.activation_keys;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can revoke keys'; END IF;
  SELECT * INTO rec FROM public.activation_keys WHERE id = input_id;
  IF rec IS NULL THEN RAISE EXCEPTION 'Key not found'; END IF;
  UPDATE public.activation_keys SET revoked = true WHERE id = input_id;
  PERFORM public.log_owner_action('activation_key.revoked','activation_key',input_id::text,left(rec.key,12) || '…',
    jsonb_build_object('revoked',rec.revoked), jsonb_build_object('revoked',true));
END; $$;

REVOKE EXECUTE ON FUNCTION public.owner_revoke_activation_key(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_revoke_activation_key(uuid) TO authenticated;

-- 4) REDEEM: backward compatible, now multi-use / revoke / expiry aware
CREATE OR REPLACE FUNCTION public.redeem_activation_key(input_key text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec public.activation_keys; days integer; new_until timestamptz; uid uuid; mail text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  mail := coalesce(auth.jwt() ->> 'email', '');
  SELECT * INTO rec FROM public.activation_keys WHERE key = upper(trim(input_key)) FOR UPDATE;
  IF rec IS NULL THEN RAISE EXCEPTION 'Invalid activation key'; END IF;
  IF rec.revoked THEN RAISE EXCEPTION 'This key has been revoked'; END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN RAISE EXCEPTION 'This key has expired'; END IF;
  IF rec.assigned_email IS NOT NULL AND lower(mail) <> rec.assigned_email THEN
    RAISE EXCEPTION 'This key is assigned to another account';
  END IF;
  IF rec.redemption_count >= rec.max_redemptions THEN RAISE EXCEPTION 'This key has already been used'; END IF;

  days := coalesce(rec.duration_days, CASE rec.plan
    WHEN '1_day' THEN 1 WHEN '7_days' THEN 7 WHEN '1_month' THEN 30
    WHEN '90_days' THEN 90 WHEN '6_months' THEN 182 WHEN '1_year' THEN 365
    WHEN 'lifetime' THEN NULL ELSE 30 END);

  IF rec.plan = 'lifetime' OR days IS NULL THEN
    INSERT INTO public.app_users (id, email, role, status, activated_until)
    VALUES (uid, mail, CASE WHEN lower(mail) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE 'user' END, 'active', 'infinity'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET email = excluded.email, status = 'active', activated_until = 'infinity'::timestamptz
    RETURNING activated_until INTO new_until;
  ELSE
    INSERT INTO public.app_users (id, email, role, status, activated_until)
    VALUES (uid, mail, CASE WHEN lower(mail) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE 'user' END, 'active', now() + make_interval(days => days))
    ON CONFLICT (id) DO UPDATE SET
      email = excluded.email, status = 'active',
      activated_until = greatest(coalesce(public.app_users.activated_until, now()), now()) + make_interval(days => days)
    RETURNING activated_until INTO new_until;
  END IF;

  UPDATE public.activation_keys
     SET redemption_count = rec.redemption_count + 1,
         redeemed_by = coalesce(rec.redeemed_by, uid),
         redeemed_at = coalesce(rec.redeemed_at, now())
   WHERE id = rec.id;

  PERFORM public.log_owner_action('activation_key.redeemed','app_user',uid::text,mail,NULL,
    jsonb_build_object('plan',rec.plan,'activated_until',new_until));
  RETURN new_until;
END; $$;

-- 5) USER ACCESS CONTROL ---------------------------------------
CREATE OR REPLACE FUNCTION public.owner_set_user_access(
  input_email text,
  input_until timestamptz DEFAULT NULL,
  input_unlimited boolean DEFAULT false
) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev timestamptz; next_until timestamptz;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can change access'; END IF;
  SELECT activated_until INTO prev FROM public.app_users WHERE lower(email) = lower(input_email);
  next_until := CASE WHEN input_unlimited THEN 'infinity'::timestamptz ELSE input_until END;
  UPDATE public.app_users
     SET activated_until = next_until,
         status = CASE WHEN next_until IS NOT NULL AND next_until > now() THEN 'active' ELSE status END
   WHERE lower(email) = lower(input_email) AND role <> 'owner';
  PERFORM public.log_owner_action('user.access_changed','app_user',NULL,input_email,
    jsonb_build_object('activated_until',prev), jsonb_build_object('activated_until',next_until));
  RETURN next_until;
END; $$;

REVOKE EXECUTE ON FUNCTION public.owner_set_user_access(text,timestamptz,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_set_user_access(text,timestamptz,boolean) TO authenticated;

-- extend status changes with auditing (same signature, same behaviour)
CREATE OR REPLACE FUNCTION public.owner_set_user_status(input_email text, input_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev text;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can change user status'; END IF;
  IF input_status NOT IN ('active','suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT status INTO prev FROM public.app_users WHERE lower(email) = lower(input_email);
  UPDATE public.app_users SET status = input_status WHERE lower(email) = lower(input_email) AND role <> 'owner';
  PERFORM public.log_owner_action('user.status_changed','app_user',NULL,input_email,
    jsonb_build_object('status',prev), jsonb_build_object('status',input_status));
END; $$;

-- 6) OWNER LISTS & OVERVIEW ------------------------------------
CREATE OR REPLACE FUNCTION public.owner_list_users()
RETURNS TABLE (
  id uuid, email text, role text, status text,
  activated_until timestamptz, created_at timestamptz, tournament_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Owner only'; END IF;
  RETURN QUERY
    SELECT u.id, u.email, u.role, u.status, u.activated_until, u.created_at,
           (SELECT count(*) FROM public.tournaments t WHERE t.owner_id = u.id)
      FROM public.app_users u
     ORDER BY u.created_at DESC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.owner_list_users() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_list_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Owner only'; END IF;
  SELECT jsonb_build_object(
    'users', (SELECT jsonb_build_object(
        'total', count(*),
        'active', count(*) FILTER (WHERE status = 'active' AND (activated_until IS NULL OR activated_until > now()) ),
        'expiring_soon', count(*) FILTER (WHERE activated_until IS NOT NULL AND activated_until > now() AND activated_until < now() + interval '7 days'),
        'expired', count(*) FILTER (WHERE activated_until IS NOT NULL AND activated_until <= now()),
        'suspended', count(*) FILTER (WHERE status = 'suspended')
      ) FROM public.app_users),
    'tournaments', (SELECT jsonb_build_object(
        'total', count(*),
        'active', count(*) FILTER (WHERE status = 'active' AND archived = false),
        'draft', count(*) FILTER (WHERE status = 'draft'),
        'completed', count(*) FILTER (WHERE status = 'completed'),
        'archived', count(*) FILTER (WHERE archived = true),
        'public', count(*) FILTER (WHERE is_public = true)
      ) FROM public.tournaments),
    'sponsors', (SELECT jsonb_build_object(
        'total', count(*),
        'missing_logo', count(*) FILTER (WHERE logo_url IS NULL OR logo_url = '')
      ) FROM public.sponsors),
    'advertising', (SELECT jsonb_build_object(
        'campaigns', count(*),
        'active', count(*) FILTER (WHERE status = 'active'),
        'ending_soon', count(*) FILTER (WHERE end_date IS NOT NULL AND end_date > now() AND end_date < now() + interval '7 days')
      ) FROM public.ad_campaigns),
    'ad_analytics', (SELECT jsonb_build_object(
        'impressions', count(*) FILTER (WHERE type = 'impression'),
        'clicks', count(*) FILTER (WHERE type = 'click')
      ) FROM public.ad_analytics),
    'health', jsonb_build_object(
        'campaigns_without_creative', (SELECT count(*) FROM public.ad_campaigns c WHERE NOT EXISTS (SELECT 1 FROM public.ad_creatives cr WHERE cr.campaign_id = c.id)),
        'tournaments_without_matches', (SELECT count(*) FROM public.tournaments t WHERE NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.tournament_id = t.id)),
        'matches_missing_teams', (SELECT count(*) FROM public.matches m WHERE m.status = 'completed' AND (m.team_a_id IS NULL OR m.team_b_id IS NULL)),
        'completed_without_score', (SELECT count(*) FROM public.matches m WHERE m.status = 'completed' AND (m.score_a IS NULL OR m.score_b IS NULL)),
        'expired_owners_with_active_tournaments', (SELECT count(DISTINCT t.owner_id) FROM public.tournaments t JOIN public.app_users u ON u.id = t.owner_id
            WHERE t.archived = false AND (u.status = 'suspended' OR (u.activated_until IS NOT NULL AND u.activated_until <= now())))
      )
  ) INTO result;
  RETURN result;
END; $$;

REVOKE EXECUTE ON FUNCTION public.owner_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_overview() TO authenticated;