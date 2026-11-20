CREATE OR REPLACE FUNCTION public.update_fixture_dates(_tournament_id uuid, _dates jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE expected integer; changed integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_tournament_permission(_tournament_id, 'games.edit') THEN
    RAISE EXCEPTION 'You do not have permission to update fixture dates';
  END IF;
  IF jsonb_typeof(_dates) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid fixture dates'; END IF;
  PERFORM id FROM public.matches WHERE tournament_id = _tournament_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.matches WHERE tournament_id = _tournament_id AND status NOT IN ('scheduled', 'cancelled')) THEN
    RAISE EXCEPTION 'Fixture dates can only be updated before games have started';
  END IF;
  SELECT count(*) INTO expected FROM public.matches WHERE tournament_id = _tournament_id AND status <> 'cancelled';
  IF expected = 0 OR jsonb_array_length(_dates) <> expected THEN RAISE EXCEPTION 'Fixtures changed. Refresh and try again'; END IF;
  IF (SELECT count(DISTINCT id) FROM jsonb_to_recordset(_dates) AS d(id uuid, scheduled_at timestamptz)) <> expected
    OR EXISTS (SELECT 1 FROM jsonb_to_recordset(_dates) AS d(id uuid, scheduled_at timestamptz)
      LEFT JOIN public.matches m ON m.id = d.id AND m.tournament_id = _tournament_id AND m.status = 'scheduled'
      WHERE m.id IS NULL OR d.scheduled_at IS NULL) THEN
    RAISE EXCEPTION 'Invalid fixture dates or fixtures changed. Refresh and try again';
  END IF;
  UPDATE public.matches m SET scheduled_at = d.scheduled_at
    FROM jsonb_to_recordset(_dates) AS d(id uuid, scheduled_at timestamptz)
    WHERE m.id = d.id AND m.tournament_id = _tournament_id AND m.status = 'scheduled';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> expected THEN RAISE EXCEPTION 'Unable to update all fixture dates'; END IF;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.update_fixture_dates(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_fixture_dates(uuid, jsonb) TO authenticated;