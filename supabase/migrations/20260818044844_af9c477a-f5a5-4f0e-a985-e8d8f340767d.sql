ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS player_of_match_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player_stats jsonb NOT NULL DEFAULT '[]'::jsonb;