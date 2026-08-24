-- Extension for Smart Advertising System v2
-- Add auto_placement support to campaigns
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS allow_auto_placement BOOLEAN DEFAULT true;

-- Create ad_settings table
CREATE TABLE IF NOT EXISTS public.ad_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    auto_placement_enabled BOOLEAN DEFAULT true,
    auto_placement_intensity TEXT DEFAULT 'balanced', -- low, balanced, high
    public_ads_enabled BOOLEAN DEFAULT true,
    page_rules JSONB DEFAULT '{
        "homepage": true,
        "tournament_overview": true,
        "fixtures": true,
        "standings": true,
        "teams": true,
        "knockout": true,
        "pool_draw": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_id)
);

-- RLS for ad_settings
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_settings TO authenticated;
GRANT ALL ON public.ad_settings TO service_role;
GRANT SELECT ON public.ad_settings TO anon;

CREATE POLICY "Owners can manage their ad settings"
ON public.ad_settings
FOR ALL
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Public can read ad settings"
ON public.ad_settings
FOR SELECT
TO anon
USING (public_ads_enabled = true);

-- Function to handle setting default settings on user creation if needed, 
-- but we'll likely handle it via the hook's fallback for now.

