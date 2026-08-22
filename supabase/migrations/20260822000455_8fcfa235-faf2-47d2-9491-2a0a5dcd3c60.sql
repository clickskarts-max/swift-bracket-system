REVOKE EXECUTE ON FUNCTION public.is_app_owner() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_owner() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.owner_create_activation_key(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_set_user_status(text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_app_user() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_activation_key(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, PUBLIC;

REVOKE INSERT, UPDATE, DELETE ON public.app_users FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.activation_keys FROM anon, authenticated;
REVOKE ALL ON public.activation_keys FROM anon;
REVOKE ALL ON public.app_users FROM anon;
GRANT SELECT ON public.app_users TO authenticated;
GRANT SELECT ON public.activation_keys TO authenticated;
GRANT ALL ON public.app_users TO service_role;
GRANT ALL ON public.activation_keys TO service_role;

DROP POLICY IF EXISTS "No client writes to app_users" ON public.app_users;
CREATE POLICY "No client writes to app_users"
  ON public.app_users
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client writes to activation_keys" ON public.activation_keys;
CREATE POLICY "No client writes to activation_keys"
  ON public.activation_keys
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (false);

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;