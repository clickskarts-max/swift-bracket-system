CREATE OR REPLACE FUNCTION public.guard_creative_activation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_app_owner()
     AND coalesce(NEW.status,'active') = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_creative_activation ON public.ad_creatives;
CREATE TRIGGER guard_creative_activation BEFORE INSERT OR UPDATE ON public.ad_creatives
FOR EACH ROW EXECUTE FUNCTION public.guard_creative_activation();

DROP POLICY IF EXISTS "Owners manage their campaign inventory" ON public.campaign_inventory;
CREATE POLICY "Owners view their campaign inventory" ON public.campaign_inventory
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.is_app_owner());
CREATE POLICY "Platform owner manages campaign inventory" ON public.campaign_inventory
  FOR ALL TO authenticated USING (public.is_app_owner()) WITH CHECK (public.is_app_owner());

CREATE OR REPLACE FUNCTION public.require_active_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_app_owner() THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM app_users u WHERE u.id = auth.uid() AND u.status = 'active'
                 AND (u.role = 'owner' OR (u.activated_until IS NOT NULL AND u.activated_until > now()))) THEN
    RAISE EXCEPTION 'Activate your account to create tournaments';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.require_active_account() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS require_active_account ON public.tournaments;
CREATE TRIGGER require_active_account BEFORE INSERT ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.require_active_account();