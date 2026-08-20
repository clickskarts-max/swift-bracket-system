CREATE TABLE IF NOT EXISTS public.tournament_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    google_maps_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_venues TO authenticated;
GRANT ALL ON public.tournament_venues TO service_role;
GRANT SELECT ON public.tournament_venues TO anon;

-- Enable RLS
ALTER TABLE public.tournament_venues ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own tournament venues'
    ) THEN
        CREATE POLICY "Users can manage their own tournament venues"
            ON public.tournament_venues
            FOR ALL
            TO authenticated
            USING (auth.uid() = owner_id)
            WITH CHECK (auth.uid() = owner_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'Public can view venues of public tournaments'
    ) THEN
        CREATE POLICY "Public can view venues of public tournaments"
            ON public.tournament_venues
            FOR SELECT
            TO anon, authenticated
            USING (EXISTS (
                SELECT 1 FROM public.tournaments
                WHERE tournaments.id = tournament_venues.tournament_id
                AND (tournaments.is_public = true OR auth.uid() = tournaments.owner_id)
            ));
    END IF;
END
$$;

-- Migrate existing data
INSERT INTO public.tournament_venues (tournament_id, owner_id, name, google_maps_url)
SELECT id, owner_id, venue, venue_map_url
FROM public.tournaments
WHERE venue IS NOT NULL AND venue != ''
ON CONFLICT DO NOTHING;

-- Add venue_id to matches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='matches' AND column_name='venue_id'
    ) THEN
        ALTER TABLE public.matches ADD COLUMN venue_id UUID REFERENCES public.tournament_venues(id) ON DELETE SET NULL;
    END IF;
END
$$;
