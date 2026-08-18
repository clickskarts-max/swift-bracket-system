-- Activation and owner-control system
-- Owner account is identified by email because the auth UUID is created at signup.

CREATE TABLE public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  activated_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activation_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('1_day', '1_month', '6_months', '1_year')),
  duration_days integer NOT NULL CHECK (duration_days IN (1, 30, 180, 365)),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activation_keys_hash_idx ON public.activation_keys(key_hash);
CREATE INDEX app_users_status_idx ON public.app_users(status);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_app_owner()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'maharjan.rohft@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.sync_app_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.app_users (id, email, role)
  VALUES (NEW.id, lower(NEW.email), CASE WHEN lower(NEW.email) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE 'user' END)
  ON CONFLICT (id) DO UPDATE SET email = lower(EXCLUDED.email), role = CASE WHEN lower(EXCLUDED.email) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE app_users.role END, updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_activation_profile ON auth.users;
CREATE TRIGGER on_auth_user_activation_profile AFTER INSERT OR UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_app_user();

CREATE OR REPLACE FUNCTION public.redeem_activation_key(input_key text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_user_id uuid := auth.uid();
  found_key public.activation_keys%ROWTYPE;
  new_until timestamptz;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO found_key FROM public.activation_keys
  WHERE key_hash = encode(sha256(convert_to(upper(trim(input_key)), 'UTF8')), 'hex')
    AND redeemed_at IS NULL AND revoked_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid, used, or revoked activation key'; END IF;
  SELECT greatest(coalesce(activated_until, now()), now()) + make_interval(days => found_key.duration_days)
    INTO new_until FROM public.app_users WHERE id = current_user_id;
  UPDATE public.activation_keys SET redeemed_at = now(), assigned_to = current_user_id WHERE id = found_key.id;
  UPDATE public.app_users SET activated_until = new_until, status = 'active', updated_at = now() WHERE id = current_user_id;
  RETURN jsonb_build_object('activated_until', new_until, 'plan', found_key.plan);
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_create_activation_key(input_plan text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  raw_key text := 'ECL-' || upper(substr(encode(gen_random_bytes(12), 'hex'), 1, 20));
  days integer;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Owner access required'; END IF;
  days := CASE input_plan WHEN '1_day' THEN 1 WHEN '1_month' THEN 30 WHEN '6_months' THEN 180 WHEN '1_year' THEN 365 ELSE NULL END;
  IF days IS NULL THEN RAISE EXCEPTION 'Unsupported plan'; END IF;
  INSERT INTO public.activation_keys(key_hash, plan, duration_days, created_by)
  VALUES (encode(sha256(convert_to(raw_key, 'UTF8')), 'hex'), input_plan, days, auth.uid());
  RETURN raw_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_set_user_status(target_user uuid, next_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Owner access required'; END IF;
  IF next_status NOT IN ('active', 'suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.app_users SET status = next_status, updated_at = now() WHERE id = target_user AND role <> 'owner';
END;
$$;

CREATE POLICY "users read self or owner" ON public.app_users FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_app_owner());
CREATE POLICY "owner update users" ON public.app_users FOR UPDATE TO authenticated USING (public.is_app_owner()) WITH CHECK (public.is_app_owner());
CREATE POLICY "owner read keys" ON public.activation_keys FOR SELECT TO authenticated USING (public.is_app_owner());

GRANT EXECUTE ON FUNCTION public.redeem_activation_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_create_activation_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_set_user_status(uuid, text) TO authenticated;
GRANT SELECT ON public.app_users TO authenticated;
GRANT SELECT ON public.activation_keys TO authenticated;
