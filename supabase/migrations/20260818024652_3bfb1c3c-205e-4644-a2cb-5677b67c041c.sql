CREATE OR REPLACE FUNCTION public.owner_create_activation_key(input_plan text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_key text;
BEGIN
  IF NOT public.is_app_owner() THEN RAISE EXCEPTION 'Only the owner can generate keys'; END IF;
  IF input_plan NOT IN ('1_day','1_month','6_months','1_year') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  new_key := 'ECL-' || upper(replace(gen_random_uuid()::text, '-', ''));
  INSERT INTO public.activation_keys (key, plan) VALUES (new_key, input_plan);
  RETURN new_key;
END; $function$;