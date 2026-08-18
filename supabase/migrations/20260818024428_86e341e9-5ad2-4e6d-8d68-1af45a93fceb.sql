
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  activated_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activation_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  plan text NOT NULL,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activation_keys TO authenticated;
GRANT ALL ON public.activation_keys TO service_role;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER app_users_updated BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER activation_keys_updated BEFORE UPDATE ON public.activation_keys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_app_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'maharjan.rohft@gmail.com';
$$;

CREATE POLICY "Users read own access" ON public.app_users FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_app_owner());
CREATE POLICY "Owner reads keys" ON public.activation_keys FOR SELECT TO authenticated USING (public.is_app_owner());

CREATE OR REPLACE FUNCTION public.owner_create_activation_key(input_plan text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_key text;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can generate keys'; END IF;
  IF input_plan NOT IN ('1_day','1_month','6_months','1_year') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  new_key := 'ECL-' || upper(replace(encode(gen_random_bytes(10), 'hex'), '-', ''));
  INSERT INTO public.activation_keys (key, plan) VALUES (new_key, input_plan);
  RETURN new_key;
END; $$;
GRANT EXECUTE ON FUNCTION public.owner_create_activation_key(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_activation_key(input_key text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec public.activation_keys; extra interval; new_until timestamptz; uid uuid; mail text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  mail := coalesce(auth.jwt() ->> 'email', '');
  SELECT * INTO rec FROM public.activation_keys WHERE key = upper(trim(input_key)) FOR UPDATE;
  IF rec IS NULL THEN RAISE EXCEPTION 'Invalid activation key'; END IF;
  IF rec.redeemed_by IS NOT NULL THEN RAISE EXCEPTION 'This key has already been used'; END IF;
  extra := CASE rec.plan WHEN '1_day' THEN interval '1 day' WHEN '1_month' THEN interval '1 month' WHEN '6_months' THEN interval '6 months' ELSE interval '1 year' END;

  INSERT INTO public.app_users (id, email, role, status, activated_until)
  VALUES (uid, mail, CASE WHEN lower(mail) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE 'user' END, 'active', now() + extra)
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    status = 'active',
    activated_until = greatest(coalesce(public.app_users.activated_until, now()), now()) + extra
  RETURNING activated_until INTO new_until;

  UPDATE public.activation_keys SET redeemed_by = uid, redeemed_at = now() WHERE id = rec.id;
  RETURN new_until;
END; $$;
GRANT EXECUTE ON FUNCTION public.redeem_activation_key(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_app_user()
RETURNS public.app_users LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid; mail text; row public.app_users;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  mail := coalesce(auth.jwt() ->> 'email', '');
  INSERT INTO public.app_users (id, email, role, status, activated_until)
  VALUES (uid, mail, CASE WHEN lower(mail) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE 'user' END, 'active', NULL)
  ON CONFLICT (id) DO UPDATE SET email = excluded.email,
    role = CASE WHEN lower(excluded.email) = 'maharjan.rohft@gmail.com' THEN 'owner' ELSE public.app_users.role END
  RETURNING * INTO row;
  RETURN row;
END; $$;
GRANT EXECUTE ON FUNCTION public.ensure_app_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_set_user_status(input_email text, input_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can change user status'; END IF;
  IF input_status NOT IN ('active','suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.app_users SET status = input_status WHERE lower(email) = lower(input_email) AND role <> 'owner';
END; $$;
GRANT EXECUTE ON FUNCTION public.owner_set_user_status(text, text) TO authenticated;
