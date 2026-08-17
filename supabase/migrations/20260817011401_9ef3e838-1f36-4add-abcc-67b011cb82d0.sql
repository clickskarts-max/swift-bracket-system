
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Organization',
  logo_url text,
  primary_color text DEFAULT '#F25C05',
  accent_color text DEFAULT '#111827',
  contact_email text,
  contact_phone text,
  website text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org owner all" ON public.organizations FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER organizations_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  format text NOT NULL DEFAULT 'round_robin',
  legs integer NOT NULL DEFAULT 1,
  playoff_format text NOT NULL DEFAULT 'none',
  group_count integer NOT NULL DEFAULT 0,
  team_count integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  venue text,
  venue_map_url text,
  status text NOT NULL DEFAULT 'draft',
  logo_url text,
  banner_url text,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT SELECT ON public.tournaments TO anon;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournament owner all" ON public.tournaments FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "tournament public read" ON public.tournaments FOR SELECT TO anon, authenticated USING (is_public AND NOT archived);
CREATE TRIGGER tournaments_updated BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.tournament_is_public(_tid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = _tid AND t.is_public AND NOT t.archived);
$$;

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  short_name text,
  logo_url text,
  coach_name text,
  manager_name text,
  contact text,
  jersey_color text DEFAULT '#F25C05',
  group_label text,
  seed integer,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT ON public.teams TO anon;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team owner all" ON public.teams FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "team public read" ON public.teams FOR SELECT TO anon, authenticated USING (public.tournament_is_public(tournament_id));
CREATE TRIGGER teams_updated BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  photo_url text,
  jersey_number integer,
  position text,
  age integer,
  height_cm integer,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT SELECT ON public.players TO anon;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player owner all" ON public.players FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "player public read" ON public.players FOR SELECT TO anon, authenticated USING (public.tournament_is_public(tournament_id));
CREATE TRIGGER players_updated BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  match_no integer,
  stage text NOT NULL DEFAULT 'league',
  round_name text,
  round_index integer NOT NULL DEFAULT 1,
  leg integer NOT NULL DEFAULT 1,
  group_label text,
  scheduled_at timestamptz,
  venue text,
  court text,
  team_a_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team_b_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  placeholder_a text,
  placeholder_b text,
  score_a integer,
  score_b integer,
  status text NOT NULL DEFAULT 'scheduled',
  referee text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT SELECT ON public.matches TO anon;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match owner all" ON public.matches FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "match public read" ON public.matches FOR SELECT TO anon, authenticated USING (public.tournament_is_public(tournament_id));
CREATE TRIGGER matches_updated BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  logo_url text,
  tier text DEFAULT 'partner',
  contact_person text,
  amount numeric,
  placement text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT SELECT ON public.sponsors TO anon;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsor owner all" ON public.sponsors FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "sponsor public read" ON public.sponsors FOR SELECT TO anon, authenticated USING (public.tournament_is_public(tournament_id));
CREATE TRIGGER sponsors_updated BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX idx_players_tournament ON public.players(tournament_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_sponsors_tournament ON public.sponsors(tournament_id);
