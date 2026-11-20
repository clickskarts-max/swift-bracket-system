CREATE OR REPLACE FUNCTION public.move_fixture_slots(_tournament_id uuid, _moves jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE expected integer; changed integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_tournament_permission(_tournament_id, 'games.edit') THEN RAISE EXCEPTION 'You do not have permission to move games'; END IF;
  IF jsonb_typeof(_moves) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid movement'; END IF;
  expected := jsonb_array_length(_moves);
  IF expected NOT IN (1,2) THEN RAISE EXCEPTION 'Move one game or swap two time slots'; END IF;
  PERFORM id FROM public.matches WHERE tournament_id = _tournament_id FOR UPDATE;
  IF (SELECT count(DISTINCT id) FROM jsonb_to_recordset(_moves) AS d(id uuid, expected_at timestamptz, scheduled_at timestamptz)) <> expected
    OR EXISTS (SELECT 1 FROM jsonb_to_recordset(_moves) AS d(id uuid, expected_at timestamptz, scheduled_at timestamptz)
      LEFT JOIN public.matches m ON m.id = d.id AND m.tournament_id = _tournament_id AND m.status = 'scheduled'
      WHERE m.id IS NULL OR d.scheduled_at IS NULL OR m.scheduled_at IS DISTINCT FROM d.expected_at OR m.scheduled_at IS NULL) THEN
    RAISE EXCEPTION 'Game changed or cannot be moved. Refresh and try again';
  END IF;
  UPDATE public.matches m SET scheduled_at = d.scheduled_at FROM jsonb_to_recordset(_moves) AS d(id uuid, expected_at timestamptz, scheduled_at timestamptz)
    WHERE m.id = d.id AND m.tournament_id = _tournament_id AND m.status = 'scheduled' AND m.scheduled_at = d.expected_at;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> expected THEN RAISE EXCEPTION 'Unable to move all games'; END IF;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.move_fixture_slots(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.move_fixture_slots(uuid,jsonb) TO authenticated;