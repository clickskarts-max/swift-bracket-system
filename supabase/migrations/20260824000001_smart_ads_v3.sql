-- Add new columns to ad_creatives to support provider-based ads, HTML, and responsive formats
ALTER TABLE public.ad_creatives 
ADD COLUMN IF NOT EXISTS provider_type text DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS provider_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS html_content text,
ADD COLUMN IF NOT EXISTS is_responsive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS size_preset text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS min_width integer,
ADD COLUMN IF NOT EXISTS max_width integer,
ADD COLUMN IF NOT EXISTS aspect_ratio text;

-- Add comment for documentation
COMMENT ON COLUMN public.ad_creatives.provider_type IS 'direct, adsense, custom_provider';
COMMENT ON COLUMN public.ad_creatives.creative_type IS 'image, animated, html';

-- Update existing creatives to have 'direct' provider_type
UPDATE public.ad_creatives SET provider_type = 'direct' WHERE provider_type IS NULL;

-- Ensure campaign_id is not null in the future (optional, depending on current data)
-- For now, we allow it to be nullable but the UI will enforce it.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_creatives TO authenticated;
GRANT ALL ON public.ad_creatives TO service_role;
GRANT SELECT ON public.ad_creatives TO anon;
