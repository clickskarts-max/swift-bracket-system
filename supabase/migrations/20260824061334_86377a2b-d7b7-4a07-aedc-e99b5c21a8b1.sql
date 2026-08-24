CREATE OR REPLACE FUNCTION public.owner_delete_key(input_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE rec public.activation_keys;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can delete keys'; END IF;
  SELECT * INTO rec FROM public.activation_keys WHERE id = input_id;
  IF rec IS NULL THEN RAISE EXCEPTION 'Key not found'; END IF;
  IF rec.redemption_count > 0 THEN RAISE EXCEPTION 'Redeemed keys cannot be deleted'; END IF;
  DELETE FROM public.activation_keys WHERE id = input_id;
  PERFORM public.log_owner_action('activation_key.deleted','activation_key',input_id::text,left(rec.key,12) || '…',
    jsonb_build_object('plan',rec.plan,'revoked',rec.revoked), NULL);
END; $function$;

REVOKE EXECUTE ON FUNCTION public.owner_delete_key(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.owner_delete_key(uuid) TO authenticated;