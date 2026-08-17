
DROP POLICY "team public read" ON public.teams;
DROP POLICY "player public read" ON public.players;
DROP POLICY "match public read" ON public.matches;
DROP POLICY "sponsor public read" ON public.sponsors;
DROP FUNCTION IF EXISTS public.tournament_is_public(uuid);

CREATE POLICY "team public read" ON public.teams FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = teams.tournament_id AND t.is_public AND NOT t.archived));
CREATE POLICY "player public read" ON public.players FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = players.tournament_id AND t.is_public AND NOT t.archived));
CREATE POLICY "match public read" ON public.matches FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = matches.tournament_id AND t.is_public AND NOT t.archived));
CREATE POLICY "sponsor public read" ON public.sponsors FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = sponsors.tournament_id AND t.is_public AND NOT t.archived));
