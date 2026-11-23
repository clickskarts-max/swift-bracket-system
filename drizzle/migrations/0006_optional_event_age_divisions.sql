DROP INDEX IF EXISTS public.tournament_unique_child_event;
CREATE UNIQUE INDEX tournament_unique_child_division ON public.tournaments (parent_tournament_id,event_type,(coalesce(config->>'age_group','open'))) WHERE parent_tournament_id IS NOT NULL;
ALTER TABLE public.tournaments ADD CONSTRAINT tournament_age_group_valid CHECK (NOT (config ? 'age_group') OR config->>'age_group' IS NULL OR config->>'age_group' IN ('u25','u19'));
CREATE OR REPLACE FUNCTION public.guard_tournament_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE p public.tournaments;
BEGIN
 IF TG_OP='UPDATE' AND NEW.parent_tournament_id IS NOT DISTINCT FROM OLD.parent_tournament_id AND NEW.event_type IS NOT DISTINCT FROM OLD.event_type AND coalesce(NEW.config->>'age_group','open')=coalesce(OLD.config->>'age_group','open') THEN RETURN NEW; END IF;
 IF NEW.parent_tournament_id IS NOT NULL THEN
   SELECT * INTO p FROM public.tournaments WHERE id=NEW.parent_tournament_id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Parent tournament not found'; END IF;
   IF p.parent_tournament_id IS NOT NULL THEN RAISE EXCEPTION 'Events must belong directly to a parent tournament'; END IF;
   IF p.owner_id <> NEW.owner_id THEN RAISE EXCEPTION 'Events must belong to the same account'; END IF;
   IF auth.uid() IS NOT NULL AND NOT public.has_tournament_permission(p.id,'tournament.edit') THEN RAISE EXCEPTION 'You cannot manage events for this tournament'; END IF;
   IF NEW.event_type IS NULL THEN RAISE EXCEPTION 'Choose a basketball event category'; END IF;
   IF p.config->>'event_container' IS DISTINCT FROM 'true' AND NEW.event_type=p.event_type AND coalesce(NEW.config->>'age_group','open')=coalesce(p.config->>'age_group','open') THEN RAISE EXCEPTION 'This event and age group already exist in the parent tournament'; END IF;
   IF EXISTS(SELECT 1 FROM public.tournaments WHERE parent_tournament_id=NEW.id) THEN RAISE EXCEPTION 'A tournament with events cannot become an event'; END IF;
 ELSE
   IF NEW.config->>'event_container' IS DISTINCT FROM 'true' AND NEW.event_type IS NOT NULL AND EXISTS(SELECT 1 FROM public.tournaments WHERE parent_tournament_id=NEW.id AND event_type=NEW.event_type AND coalesce(config->>'age_group','open')=coalesce(NEW.config->>'age_group','open')) THEN RAISE EXCEPTION 'This event and age group already exist'; END IF;
 END IF;
 RETURN NEW;
END; $function$;