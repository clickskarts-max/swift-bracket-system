-- Fix ad_analytics policies and grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_analytics TO authenticated;
GRANT ALL ON public.ad_analytics TO service_role;
GRANT INSERT ON public.ad_analytics TO anon;
GRANT SELECT ON public.ad_analytics TO anon;

ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their campaign analytics' AND tablename = 'ad_analytics') THEN
        CREATE POLICY "Users can view their campaign analytics"
        ON public.ad_analytics FOR SELECT TO authenticated
        USING (EXISTS (
            SELECT 1 FROM ad_campaigns 
            WHERE ad_campaigns.id = ad_analytics.campaign_id 
            AND ad_campaigns.owner_id = auth.uid()
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert analytics' AND tablename = 'ad_analytics') THEN
        CREATE POLICY "Public can insert analytics"
        ON public.ad_analytics FOR INSERT TO anon
        WITH CHECK (true);
    END IF;
END $$;
