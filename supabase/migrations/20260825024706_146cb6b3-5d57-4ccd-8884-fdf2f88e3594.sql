
-- 1. ad_placements: restrict management to app owner
DROP POLICY IF EXISTS "Authenticated users can manage placements" ON public.ad_placements;
CREATE POLICY "App owner can manage placements" ON public.ad_placements
  FOR ALL TO authenticated
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- 2. storage: ad-creatives uploads must be owned by the uploader
DROP POLICY IF EXISTS "Authenticated users can upload ad creatives" ON storage.objects;
CREATE POLICY "Authenticated users can upload ad creatives" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-creatives' AND auth.uid() = owner);

-- 3. sponsors: expose only non-sensitive columns publicly, via a view
DROP POLICY IF EXISTS "sponsor_public_read" ON public.sponsors;
REVOKE SELECT ON public.sponsors FROM anon;

CREATE OR REPLACE VIEW public.public_sponsors
WITH (security_invoker = false) AS
SELECT s.id, s.tournament_id, s.name, s.logo_url, s.tier, s.placement, s.created_at, s.updated_at
FROM public.sponsors s
JOIN public.tournaments t ON t.id = s.tournament_id
WHERE t.is_public AND NOT t.archived;

GRANT SELECT ON public.public_sponsors TO anon, authenticated;

-- 4. organizations: no blanket anon access; branding-only view
DROP POLICY IF EXISTS "Allow public select for white-labeling" ON public.organizations;
REVOKE SELECT ON public.organizations FROM anon;

CREATE OR REPLACE VIEW public.public_organizations
WITH (security_invoker = false) AS
SELECT
  o.id,
  CASE WHEN o.show_name_public THEN o.name ELSE NULL END AS name,
  CASE WHEN o.show_name_public THEN o.brand_name ELSE NULL END AS brand_name,
  CASE WHEN o.show_name_public THEN o.short_name ELSE NULL END AS short_name,
  CASE WHEN o.show_logo_public THEN o.logo_url ELSE NULL END AS logo_url,
  CASE WHEN o.show_logo_public THEN o.logo_dark_url ELSE NULL END AS logo_dark_url,
  o.favicon_url,
  o.primary_color,
  o.secondary_color,
  o.accent_color,
  o.footer_text,
  o.powered_by_enabled,
  o.custom_domain,
  CASE WHEN o.show_contact_public THEN o.contact_email ELSE NULL END AS contact_email,
  CASE WHEN o.show_contact_public THEN o.contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN o.show_contact_public THEN o.website ELSE NULL END AS website,
  CASE WHEN o.show_contact_public THEN o.socials ELSE NULL END AS socials
FROM public.organizations o;

GRANT SELECT ON public.public_organizations TO anon, authenticated;
