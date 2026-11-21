CREATE OR REPLACE FUNCTION public.guard_campaign_activation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active')
     AND auth.uid() IS NOT NULL
     AND NOT public.is_app_owner() THEN
    RAISE EXCEPTION 'Only the platform owner can activate ad campaigns';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_campaign_activation ON public.ad_campaigns;
CREATE TRIGGER guard_campaign_activation BEFORE INSERT OR UPDATE ON public.ad_campaigns
FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_activation();