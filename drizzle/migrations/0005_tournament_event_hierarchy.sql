ALTER TABLE public.tournaments ADD COLUMN parent_tournament_id uuid REFERENCES public.tournaments(id) ON DELETE RESTRICT, ADD COLUMN event_type text;
ALTER TABLE public.tournaments ADD CONSTRAINT tournament_event_type_valid CHECK (event_type IS NULL OR event_type IN ('5x5_men','5x5_women','3x3_men','3x3_women')), ADD CONSTRAINT tournament_not_own_parent CHECK (parent_tournament_id IS NULL OR parent_tournament_id <> id);
CREATE UNIQUE INDEX tournament_unique_child_event ON public.tournaments(parent_tournament_id,event_type) WHERE parent_tournament_id IS NOT NULL;
CREATE INDEX tournament_parent_lookup ON public.tournaments(parent_tournament_id);
GRANT SELECT (parent_tournament_id,event_type) ON public.tournaments TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.guard_tournament_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.tournaments;
BEGIN
 IF TG_OP='UPDATE' AND NEW.parent_tournament_id IS NOT DISTINCT FROM OLD.parent_tournament_id AND NEW.event_type IS NOT DISTINCT FROM OLD.event_type THEN RETURN NEW; END IF;
 IF NEW.parent_tournament_id IS NOT NULL THEN
   SELECT * INTO p FROM public.tournaments WHERE id=NEW.parent_tournament_id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Parent tournament not found'; END IF;
   IF p.parent_tournament_id IS NOT NULL THEN RAISE EXCEPTION 'Events must belong directly to a parent tournament'; END IF;
   IF p.owner_id <> NEW.owner_id THEN RAISE EXCEPTION 'Events must belong to the same account'; END IF;
   IF auth.uid() IS NOT NULL AND NOT public.has_tournament_permission(p.id,'tournament.edit') THEN RAISE EXCEPTION 'You cannot manage events for this tournament'; END IF;
   IF NEW.event_type IS NULL THEN RAISE EXCEPTION 'Choose a basketball event category'; END IF;
   IF NEW.event_type = p.event_type THEN RAISE EXCEPTION 'This event category already exists in the parent tournament'; END IF;
   IF EXISTS(SELECT 1 FROM public.tournaments WHERE parent_tournament_id=NEW.id) THEN RAISE EXCEPTION 'A tournament with events cannot become an event'; END IF;
 ELSE
   IF NEW.event_type IS NOT NULL AND EXISTS(SELECT 1 FROM public.tournaments WHERE parent_tournament_id=NEW.id AND event_type=NEW.event_type) THEN RAISE EXCEPTION 'This event category already exists'; END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_tournament_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_tournament_event BEFORE INSERT OR UPDATE OF parent_tournament_id,event_type ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.guard_tournament_event();
COMMENT ON COLUMN public.tournaments.parent_tournament_id IS 'Parent competition; each linked tournament remains an independently managed basketball event.';