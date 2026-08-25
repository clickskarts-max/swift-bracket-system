
DROP VIEW IF EXISTS public.public_sponsors;
DROP VIEW IF EXISTS public.public_organizations;

CREATE OR REPLACE FUNCTION public.get_public_sponsors(p_tournament_id uuid)
RETURNS TABLE (
  id uuid,
  tournament_id uuid,
  name text,
  logo_url text,
  tier text,
  placement text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.tournament_id, s.name, s.logo_url, s.tier, s.placement, s.created_at, s.updated_at
  FROM public.sponsors s
  JOIN public.tournaments t ON t.id = s.tournament_id
  WHERE s.tournament_id = p_tournament_id
    AND t.is_public
    AND NOT t.archived
  ORDER BY s.name;
$$;

REVOKE ALL ON FUNCTION public.get_public_sponsors(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_sponsors(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_branding(p_hostname text)
RETURNS TABLE (
  id uuid,
  name text,
  brand_name text,
  short_name text,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  footer_text text,
  powered_by_enabled boolean,
  custom_domain text,
  contact_email text,
  contact_phone text,
  website text,
  socials jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    CASE WHEN o.show_name_public THEN o.name END,
    CASE WHEN o.show_name_public THEN o.brand_name END,
    CASE WHEN o.show_name_public THEN o.short_name END,
    CASE WHEN o.show_logo_public THEN o.logo_url END,
    CASE WHEN o.show_logo_public THEN o.logo_dark_url END,
    o.favicon_url,
    o.primary_color,
    o.secondary_color,
    o.accent_color,
    o.footer_text,
    o.powered_by_enabled,
    o.custom_domain,
    CASE WHEN o.show_contact_public THEN o.contact_email END,
    CASE WHEN o.show_contact_public THEN o.contact_phone END,
    CASE WHEN o.show_contact_public THEN o.website END,
    CASE WHEN o.show_contact_public THEN o.socials END
  FROM public.organizations o
  ORDER BY (o.custom_domain IS NOT DISTINCT FROM p_hostname) DESC, o.created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_branding(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_branding(text) TO anon, authenticated;
