UPDATE public.matches SET round_name='Final · Game 1' WHERE id='dc75c346-96ec-431c-8336-5fccb50565ed';
INSERT INTO public.matches (tournament_id, owner_id, match_no, stage, round_name, round_index, leg, placeholder_a, placeholder_b, status, scheduled_at)
SELECT t.id, t.owner_id, v.no, 'final', v.rn, 302, v.leg, v.pa, v.pb, 'scheduled', v.at::timestamptz
FROM public.tournaments t,
(VALUES (61,'Final · Game 2',2,'Winner M59','Winner M57','2026-10-04 11:45:00+00'),
        (62,'Final · Game 3 (if needed)',3,'Winner M57','Winner M59','2026-10-05 11:45:00+00')) v(no,rn,leg,pa,pb,at)
WHERE t.id='b524ae7e-553a-4125-bf6e-c50c46b8c1ba';