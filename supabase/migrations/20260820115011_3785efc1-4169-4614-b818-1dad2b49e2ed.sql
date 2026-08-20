
-- Revoke default public EXECUTE privileges from sensitive SECURITY DEFINER functions
-- Using only the function names/signatures that definitely exist based on migration history.

REVOKE EXECUTE ON FUNCTION public.redeem_activation_key(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owner_create_activation_key(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owner_set_user_status(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_app_user() FROM PUBLIC, anon, authenticated;

-- Re-grant to only authorized roles
GRANT EXECUTE ON FUNCTION public.redeem_activation_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_create_activation_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_set_user_status(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_app_user() TO authenticated;
