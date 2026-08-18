DROP VIEW IF EXISTS public.public_teams;
DROP VIEW IF EXISTS public.public_players;
DROP VIEW IF EXISTS public.public_sponsors;

-- anon may read only non-sensitive columns of these tables
GRANT SELECT (id, tournament_id, name, short_name, logo_url, jersey_color, group_label, seed, socials, created_at, updated_at)
  ON public.teams TO anon;
GRANT SELECT (id, tournament_id, team_id, name, photo_url, jersey_number, "position", stats, created_at, updated_at)
  ON public.players TO anon;
GRANT SELECT (id, tournament_id, name, logo_url, tier, placement, created_at, updated_at)
  ON public.sponsors TO anon;

-- public read rows only for public, non-archived tournaments, and only for the anon role
CREATE POLICY "team public read" ON public.teams FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = teams.tournament_id AND t.is_public AND NOT t.archived));

CREATE POLICY "player public read" ON public.players FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = players.tournament_id AND t.is_public AND NOT t.archived));

CREATE POLICY "sponsor public read" ON public.sponsors FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = sponsors.tournament_id AND t.is_public AND NOT t.archived));