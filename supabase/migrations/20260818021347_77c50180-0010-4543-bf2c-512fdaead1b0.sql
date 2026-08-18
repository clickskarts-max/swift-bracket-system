-- Remove broad public read on sensitive tables and replace with safe public views

DROP POLICY IF EXISTS "team public read" ON public.teams;
DROP POLICY IF EXISTS "player public read" ON public.players;
DROP POLICY IF EXISTS "sponsor public read" ON public.sponsors;

REVOKE SELECT ON public.teams FROM anon;
REVOKE SELECT ON public.players FROM anon;
REVOKE SELECT ON public.sponsors FROM anon;

CREATE OR REPLACE VIEW public.public_teams AS
SELECT t.id, t.tournament_id, t.name, t.short_name, t.logo_url, t.jersey_color,
       t.group_label, t.seed, t.created_at
FROM public.teams t
JOIN public.tournaments tr ON tr.id = t.tournament_id
WHERE tr.is_public AND NOT tr.archived;

CREATE OR REPLACE VIEW public.public_players AS
SELECT p.id, p.tournament_id, p.team_id, p.name, p.photo_url, p.jersey_number,
       p.position, p.stats, p.created_at
FROM public.players p
JOIN public.tournaments tr ON tr.id = p.tournament_id
WHERE tr.is_public AND NOT tr.archived;

CREATE OR REPLACE VIEW public.public_sponsors AS
SELECT s.id, s.tournament_id, s.name, s.logo_url, s.tier, s.placement, s.created_at
FROM public.sponsors s
JOIN public.tournaments tr ON tr.id = s.tournament_id
WHERE tr.is_public AND NOT tr.archived;

GRANT SELECT ON public.public_teams TO anon, authenticated;
GRANT SELECT ON public.public_players TO anon, authenticated;
GRANT SELECT ON public.public_sponsors TO anon, authenticated;