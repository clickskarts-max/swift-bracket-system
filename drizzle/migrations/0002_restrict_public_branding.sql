CREATE OR REPLACE FUNCTION public.get_public_branding(p_hostname text)
 RETURNS TABLE(id uuid, name text, brand_name text, short_name text, logo_url text, logo_dark_url text, favicon_url text, primary_color text, secondary_color text, accent_color text, footer_text text, powered_by_enabled boolean, custom_domain text, contact_email text, contact_phone text, website text, socials jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT o.id,
    CASE WHEN o.show_name_public THEN o.name END,
    CASE WHEN o.show_name_public THEN o.brand_name END,
    CASE WHEN o.show_name_public THEN o.short_name END,
    CASE WHEN o.show_logo_public THEN o.logo_url END,
    CASE WHEN o.show_logo_public THEN o.logo_dark_url END,
    o.favicon_url, o.primary_color, o.secondary_color, o.accent_color, o.footer_text, o.powered_by_enabled,
    o.custom_domain,
    CASE WHEN o.show_contact_public THEN o.contact_email END,
    CASE WHEN o.show_contact_public THEN o.contact_phone END,
    CASE WHEN o.show_contact_public THEN o.website END,
    CASE WHEN o.show_contact_public THEN o.socials END
  FROM public.organizations o
  WHERE (p_hostname IS NOT NULL AND o.custom_domain IS NOT NULL AND lower(o.custom_domain) = lower(p_hostname))
     OR o.owner_id IN (SELECT u.id FROM public.app_users u WHERE u.role = 'owner')
  ORDER BY (o.custom_domain IS NOT NULL AND lower(o.custom_domain) = lower(coalesce(p_hostname,''))) DESC, o.created_at ASC
  LIMIT 1;
$function$;