ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS tournament_targeting_mode text NOT NULL DEFAULT 'all'
  CHECK (tournament_targeting_mode IN ('all','selected','none'));

CREATE TABLE IF NOT EXISTS public.ad_campaign_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, tournament_id)
);

CREATE INDEX IF NOT EXISTS idx_act_campaign ON public.ad_campaign_tournaments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_act_tournament ON public.ad_campaign_tournaments(tournament_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaign_tournaments TO authenticated;
GRANT SELECT ON public.ad_campaign_tournaments TO anon;
GRANT ALL ON public.ad_campaign_tournaments TO service_role;

ALTER TABLE public.ad_campaign_tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage campaign tournament targeting" ON public.ad_campaign_tournaments;
CREATE POLICY "Owners manage campaign tournament targeting"
ON public.ad_campaign_tournaments FOR ALL TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public can read targeting for active campaigns" ON public.ad_campaign_tournaments;
CREATE POLICY "Public can read targeting for active campaigns"
ON public.ad_campaign_tournaments FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.ad_campaigns c
  WHERE c.id = ad_campaign_tournaments.campaign_id AND c.status = 'active'
));