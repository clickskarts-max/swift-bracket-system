
-- Standardize and Harden RLS Policies for Strict Data Isolation

-- Tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tournament owner all" ON public.tournaments;
CREATE POLICY "tournament_owner_manage" ON public.tournaments
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "tournament public read" ON public.tournaments;
CREATE POLICY "tournament_public_read" ON public.tournaments
  FOR SELECT TO anon, authenticated
  USING (is_public AND NOT archived);

-- Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team owner all" ON public.teams;
CREATE POLICY "team_owner_manage" ON public.teams
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "team public read" ON public.teams;
CREATE POLICY "team_public_read" ON public.teams
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id AND t.is_public AND NOT t.archived
  ));

-- Players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player owner all" ON public.players;
CREATE POLICY "player_owner_manage" ON public.players
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "player public read" ON public.players;
CREATE POLICY "player_public_read" ON public.players
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = players.tournament_id AND t.is_public AND NOT t.archived
  ));

-- Matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "match owner all" ON public.matches;
CREATE POLICY "match_owner_manage" ON public.matches
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "match public read" ON public.matches;
CREATE POLICY "match_public_read" ON public.matches
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = matches.tournament_id AND t.is_public AND NOT t.archived
  ));

-- Sponsors
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sponsor owner all" ON public.sponsors;
CREATE POLICY "sponsor_owner_manage" ON public.sponsors
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "sponsor public read" ON public.sponsors;
CREATE POLICY "sponsor_public_read" ON public.sponsors
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = sponsors.tournament_id AND t.is_public AND NOT t.archived
  ));

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org owner all" ON public.organizations;
CREATE POLICY "org_owner_manage" ON public.organizations
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Storage bucket RLS (avoiding the uuid=text mismatch by explicit casting if possible or checking structure)
-- In Supabase Storage 'objects' table, 'owner' is a UUID type.
DROP POLICY IF EXISTS "media owner read" ON storage.objects;
DROP POLICY IF EXISTS "media owner insert" ON storage.objects;
DROP POLICY IF EXISTS "media owner update" ON storage.objects;
DROP POLICY IF EXISTS "media owner delete" ON storage.objects;

CREATE POLICY "media_owner_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());
CREATE POLICY "media_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND owner = auth.uid());
CREATE POLICY "media_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid()) WITH CHECK (bucket_id = 'media' AND owner = auth.uid());
CREATE POLICY "media_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());

-- Public read for media (logos/photos)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
