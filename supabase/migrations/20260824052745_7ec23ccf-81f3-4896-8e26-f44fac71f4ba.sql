-- 1. Campaign inventory (display placements + sponsorship slots)
CREATE TABLE IF NOT EXISTS public.campaign_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, inventory_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_inventory TO authenticated;
GRANT SELECT ON public.campaign_inventory TO anon;
GRANT ALL ON public.campaign_inventory TO service_role;

ALTER TABLE public.campaign_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their campaign inventory"
  ON public.campaign_inventory FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Public can read inventory for active campaigns"
  ON public.campaign_inventory FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.ad_campaigns c WHERE c.id = campaign_inventory.campaign_id AND c.status = 'active'));

CREATE INDEX IF NOT EXISTS campaign_inventory_campaign_idx ON public.campaign_inventory(campaign_id);

-- 2. Creative roles + sponsor / native fields
ALTER TABLE public.ad_creatives
  ADD COLUMN IF NOT EXISTS creative_role text NOT NULL DEFAULT 'display',
  ADD COLUMN IF NOT EXISTS sponsor_name text,
  ADD COLUMN IF NOT EXISTS sponsor_label text,
  ADD COLUMN IF NOT EXISTS logo_dark_url text,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS cta_label text;

-- 3. Inventory-level analytics
ALTER TABLE public.ad_analytics
  ADD COLUMN IF NOT EXISTS inventory_key text;

CREATE INDEX IF NOT EXISTS ad_analytics_inventory_idx ON public.ad_analytics(campaign_id, inventory_key);

-- 4. Global master switches
ALTER TABLE public.ad_settings
  ADD COLUMN IF NOT EXISTS sponsorships_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS native_ads_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sticky_mobile_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adsense_fallback_enabled boolean NOT NULL DEFAULT true;