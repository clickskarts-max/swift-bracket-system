
-- ============================================================
-- RBAC: account (workspace = owner user id) + tournament roles
-- Resolution order (documented, enforced in has_tournament_permission):
--   1. Tournament owner (creator, = account owner)  -> full access
--   2. Account role in the tournament's account      -> role_permissions
--   3. Tournament membership role                    -> role_permissions
-- Permissions from (2) and (3) are unioned; neither grants access to
-- tournaments outside its own account / tournament.
-- ============================================================

CREATE TABLE public.role_permissions (
  role text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('account','tournament')),
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read role map" ON public.role_permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.role_permissions (role, scope, permission)
SELECT r, s, p FROM (VALUES
  -- tournament admin: everything in one tournament
  ('tournament_admin','tournament', ARRAY['tournament.view','tournament.edit','tournament.delete','teams.view','teams.create','teams.edit','teams.delete','players.view','players.create','players.edit','players.delete','games.view','games.create','games.edit','games.delete','games.score','games.finalize','statistics.view','statistics.edit','standings.view','users.view','users.invite','users.remove','users.manage_roles']),
  ('tournament_editor','tournament', ARRAY['tournament.view','tournament.edit','teams.view','teams.create','teams.edit','teams.delete','players.view','players.create','players.edit','players.delete','games.view','games.create','games.edit','games.delete','statistics.view','standings.view']),
  ('scorekeeper','tournament', ARRAY['tournament.view','teams.view','players.view','games.view','games.score','games.finalize','statistics.view','statistics.edit','standings.view']),
  ('statistician','tournament', ARRAY['tournament.view','teams.view','players.view','games.view','statistics.view','statistics.edit','standings.view']),
  ('tournament_viewer','tournament', ARRAY['tournament.view','teams.view','players.view','games.view','statistics.view','standings.view']),
  -- account roles (apply to every tournament in that account)
  ('account_owner','account', ARRAY['account.manage','account.users.view','account.users.invite','account.users.manage','tournaments.create','tournament.view','tournament.edit','tournament.delete','teams.view','teams.create','teams.edit','teams.delete','players.view','players.create','players.edit','players.delete','games.view','games.create','games.edit','games.delete','games.score','games.finalize','statistics.view','statistics.edit','standings.view','users.view','users.invite','users.remove','users.manage_roles']),
  ('account_admin','account', ARRAY['account.users.view','account.users.invite','account.users.manage','tournaments.create','tournament.view','tournament.edit','teams.view','teams.create','teams.edit','teams.delete','players.view','players.create','players.edit','players.delete','games.view','games.create','games.edit','games.delete','games.score','games.finalize','statistics.view','statistics.edit','standings.view','users.view','users.invite','users.remove','users.manage_roles']),
  ('account_member','account', ARRAY['tournaments.create']),
  ('account_viewer','account', ARRAY['tournament.view','teams.view','players.view','games.view','statistics.view','standings.view'])
) v(r, s, perms), unnest(perms) p;

CREATE TABLE public.account_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('account_owner','account_admin','account_member','account_viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);
GRANT SELECT ON public.account_memberships TO authenticated;
GRANT ALL ON public.account_memberships TO service_role;
ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own account memberships" ON public.account_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR account_id = auth.uid());

CREATE TABLE public.tournament_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('tournament_admin','tournament_editor','scorekeeper','statistician','tournament_viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
GRANT SELECT ON public.tournament_memberships TO authenticated;
GRANT ALL ON public.tournament_memberships TO service_role;
ALTER TABLE public.tournament_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own tournament memberships" ON public.tournament_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  message text,
  invited_by uuid NOT NULL,
  accepted_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
-- no direct client access: everything goes through the functions below

CREATE TABLE public.access_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid,
  target_email text,
  account_id uuid,
  tournament_id uuid,
  action text NOT NULL,
  old_role text,
  new_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.access_audit_log TO authenticated;
GRANT ALL ON public.access_audit_log TO service_role;
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account owners read access history" ON public.access_audit_log FOR SELECT TO authenticated
  USING (account_id = auth.uid() OR actor_user_id = auth.uid());

CREATE TRIGGER trg_account_memberships_updated BEFORE UPDATE ON public.account_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tournament_memberships_updated BEFORE UPDATE ON public.tournament_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_invitations_updated BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------- Central resolvers ----------------
CREATE OR REPLACE FUNCTION public.has_account_permission(_account_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    _account_id = auth.uid()
    OR EXISTS (SELECT 1 FROM account_memberships am JOIN role_permissions rp ON rp.role = am.role
               WHERE am.account_id = _account_id AND am.user_id = auth.uid() AND am.status = 'active' AND rp.permission = _perm)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_tournament_permission(_tournament_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = _tournament_id AND (
      t.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM account_memberships am JOIN role_permissions rp ON rp.role = am.role
                 WHERE am.account_id = t.owner_id AND am.user_id = auth.uid() AND am.status = 'active' AND rp.permission = _perm)
      OR EXISTS (SELECT 1 FROM tournament_memberships tm JOIN role_permissions rp ON rp.role = tm.role
                 WHERE tm.tournament_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'active' AND rp.permission = _perm)
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.my_tournament_permissions(_tournament_id uuid)
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(DISTINCT rp.permission), '{}') FROM role_permissions rp
  WHERE rp.scope = 'tournament' AND public.has_tournament_permission(_tournament_id, rp.permission)
$$;

CREATE OR REPLACE FUNCTION public.my_accessible_tournaments()
RETURNS SETOF public.tournaments LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM tournaments t WHERE public.has_tournament_permission(t.id, 'tournament.view') ORDER BY t.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.log_access_event(_action text, _account uuid, _tournament uuid, _target uuid, _email text, _old text, _new text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO access_audit_log(actor_user_id, target_user_id, target_email, account_id, tournament_id, action, old_role, new_role)
  VALUES (auth.uid(), _target, _email, _account, _tournament, _action, _old, _new)
$$;
REVOKE ALL ON FUNCTION public.log_access_event(text,uuid,uuid,uuid,text,text,text) FROM PUBLIC, anon, authenticated;

-- ---------------- Owner-id normalization + scorekeeper column guard ----------------
CREATE OR REPLACE FUNCTION public.set_child_owner_from_tournament()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT owner_id INTO NEW.owner_id FROM tournaments WHERE id = NEW.tournament_id;
  IF NEW.owner_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.keep_tournament_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.owner_id := OLD.owner_id; RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.guard_match_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_tournament_permission(OLD.tournament_id, 'games.edit') THEN RETURN NEW; END IF;
  -- score/stat-only roles: only result fields may change
  IF NEW.tournament_id IS DISTINCT FROM OLD.tournament_id OR NEW.team_a_id IS DISTINCT FROM OLD.team_a_id
     OR NEW.team_b_id IS DISTINCT FROM OLD.team_b_id OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
     OR NEW.stage IS DISTINCT FROM OLD.stage OR NEW.round_index IS DISTINCT FROM OLD.round_index
     OR NEW.match_no IS DISTINCT FROM OLD.match_no OR NEW.venue_id IS DISTINCT FROM OLD.venue_id
     OR NEW.venue IS DISTINCT FROM OLD.venue OR NEW.court IS DISTINCT FROM OLD.court
     OR NEW.placeholder_a IS DISTINCT FROM OLD.placeholder_a OR NEW.placeholder_b IS DISTINCT FROM OLD.placeholder_b THEN
    RAISE EXCEPTION 'You have access to this tournament, but you don''t have permission to perform this action.';
  END IF;
  IF NOT public.has_tournament_permission(OLD.tournament_id, 'games.score')
     AND (NEW.score_a IS DISTINCT FROM OLD.score_a OR NEW.score_b IS DISTINCT FROM OLD.score_b
          OR NEW.status IS DISTINCT FROM OLD.status OR NEW.periods IS DISTINCT FROM OLD.periods) THEN
    RAISE EXCEPTION 'You have access to this tournament, but you don''t have permission to perform this action.';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_tournaments_keep_owner BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.keep_tournament_owner();
CREATE TRIGGER trg_teams_owner BEFORE INSERT OR UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_from_tournament();
CREATE TRIGGER trg_players_owner BEFORE INSERT OR UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_from_tournament();
CREATE TRIGGER trg_matches_owner BEFORE INSERT OR UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_from_tournament();
CREATE TRIGGER trg_venues_owner BEFORE INSERT OR UPDATE ON public.tournament_venues FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_from_tournament();
CREATE TRIGGER trg_sponsors_owner BEFORE INSERT OR UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_from_tournament();
CREATE TRIGGER trg_matches_guard BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.guard_match_update();

-- ---------------- Membership-based RLS (added alongside existing owner policies) ----------------
CREATE POLICY rbac_tournament_view ON public.tournaments FOR SELECT TO authenticated USING (public.has_tournament_permission(id, 'tournament.view'));
CREATE POLICY rbac_tournament_edit ON public.tournaments FOR UPDATE TO authenticated USING (public.has_tournament_permission(id, 'tournament.edit')) WITH CHECK (public.has_tournament_permission(id, 'tournament.edit'));
CREATE POLICY rbac_tournament_delete ON public.tournaments FOR DELETE TO authenticated USING (public.has_tournament_permission(id, 'tournament.delete'));

CREATE POLICY rbac_teams_view ON public.teams FOR SELECT TO authenticated USING (public.has_tournament_permission(tournament_id, 'teams.view'));
CREATE POLICY rbac_teams_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (public.has_tournament_permission(tournament_id, 'teams.create'));
CREATE POLICY rbac_teams_update ON public.teams FOR UPDATE TO authenticated USING (public.has_tournament_permission(tournament_id, 'teams.edit')) WITH CHECK (public.has_tournament_permission(tournament_id, 'teams.edit'));
CREATE POLICY rbac_teams_delete ON public.teams FOR DELETE TO authenticated USING (public.has_tournament_permission(tournament_id, 'teams.delete'));

CREATE POLICY rbac_players_view ON public.players FOR SELECT TO authenticated USING (public.has_tournament_permission(tournament_id, 'players.view'));
CREATE POLICY rbac_players_insert ON public.players FOR INSERT TO authenticated WITH CHECK (public.has_tournament_permission(tournament_id, 'players.create'));
CREATE POLICY rbac_players_update ON public.players FOR UPDATE TO authenticated USING (public.has_tournament_permission(tournament_id, 'players.edit')) WITH CHECK (public.has_tournament_permission(tournament_id, 'players.edit'));
CREATE POLICY rbac_players_delete ON public.players FOR DELETE TO authenticated USING (public.has_tournament_permission(tournament_id, 'players.delete'));

CREATE POLICY rbac_matches_view ON public.matches FOR SELECT TO authenticated USING (public.has_tournament_permission(tournament_id, 'games.view'));
CREATE POLICY rbac_matches_insert ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_tournament_permission(tournament_id, 'games.create'));
CREATE POLICY rbac_matches_update ON public.matches FOR UPDATE TO authenticated
  USING (public.has_tournament_permission(tournament_id, 'games.edit') OR public.has_tournament_permission(tournament_id, 'games.score') OR public.has_tournament_permission(tournament_id, 'statistics.edit'))
  WITH CHECK (public.has_tournament_permission(tournament_id, 'games.edit') OR public.has_tournament_permission(tournament_id, 'games.score') OR public.has_tournament_permission(tournament_id, 'statistics.edit'));
CREATE POLICY rbac_matches_delete ON public.matches FOR DELETE TO authenticated USING (public.has_tournament_permission(tournament_id, 'games.delete'));

CREATE POLICY rbac_venues_view ON public.tournament_venues FOR SELECT TO authenticated USING (public.has_tournament_permission(tournament_id, 'tournament.view'));
CREATE POLICY rbac_venues_manage ON public.tournament_venues FOR ALL TO authenticated USING (public.has_tournament_permission(tournament_id, 'tournament.edit')) WITH CHECK (public.has_tournament_permission(tournament_id, 'tournament.edit'));
CREATE POLICY rbac_sponsors_manage ON public.sponsors FOR ALL TO authenticated USING (public.has_tournament_permission(tournament_id, 'tournament.edit')) WITH CHECK (public.has_tournament_permission(tournament_id, 'tournament.edit'));

-- ---------------- Bootstrap: preserve existing access ----------------
INSERT INTO public.account_memberships (account_id, user_id, role)
SELECT id, id, 'account_owner' FROM public.app_users ON CONFLICT DO NOTHING;
INSERT INTO public.account_memberships (account_id, user_id, role)
SELECT DISTINCT owner_id, owner_id, 'account_owner' FROM public.tournaments ON CONFLICT DO NOTHING;
INSERT INTO public.tournament_memberships (tournament_id, user_id, role)
SELECT id, owner_id, 'tournament_admin' FROM public.tournaments ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.on_tournament_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO account_memberships (account_id, user_id, role) VALUES (NEW.owner_id, NEW.owner_id, 'account_owner') ON CONFLICT DO NOTHING;
  INSERT INTO tournament_memberships (tournament_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'tournament_admin') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_tournament_created AFTER INSERT ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.on_tournament_created();

CREATE OR REPLACE FUNCTION public.on_app_user_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO account_memberships (account_id, user_id, role) VALUES (NEW.id, NEW.id, 'account_owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_app_user_created AFTER INSERT ON public.app_users FOR EACH ROW EXECUTE FUNCTION public.on_app_user_created();

-- ---------------- Invitations ----------------
CREATE OR REPLACE FUNCTION public.create_invitation(_account_id uuid, _tournament_id uuid, _email text, _role text, _days integer DEFAULT 7, _message text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_email text := lower(trim(_email));
  v_token text;
  v_existing uuid;
  v_id uuid;
  v_account uuid := _account_id;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Enter a valid email address'; END IF;
  IF _tournament_id IS NOT NULL THEN
    SELECT owner_id INTO v_account FROM tournaments WHERE id = _tournament_id;
    IF NOT public.has_tournament_permission(_tournament_id, 'users.invite') THEN
      RAISE EXCEPTION 'You don''t have permission to access this tournament.'; END IF;
    IF _role NOT IN ('tournament_admin','tournament_editor','scorekeeper','statistician','tournament_viewer') THEN RAISE EXCEPTION 'Invalid tournament role'; END IF;
  ELSE
    IF NOT public.has_account_permission(v_account, 'account.users.invite') THEN
      RAISE EXCEPTION 'You don''t have permission to invite users to this workspace.'; END IF;
    IF _role NOT IN ('account_admin','account_member','account_viewer') THEN RAISE EXCEPTION 'Invalid workspace role'; END IF;
    IF _role = 'account_admin' AND v_account <> auth.uid() THEN RAISE EXCEPTION 'Only the workspace owner can invite admins'; END IF;
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  -- revoke older pending invites for the same target
  UPDATE invitations SET status = 'revoked' WHERE status = 'pending' AND email = v_email
    AND account_id = v_account AND tournament_id IS NOT DISTINCT FROM _tournament_id;
  INSERT INTO invitations (account_id, tournament_id, email, role, token_hash, message, invited_by, expires_at)
  VALUES (v_account, _tournament_id, v_email, _role, encode(digest(v_token, 'sha256'), 'hex'), NULLIF(trim(_message), ''), auth.uid(),
          now() + make_interval(days => GREATEST(1, LEAST(COALESCE(_days, 7), 60))))
  RETURNING id INTO v_id;
  PERFORM public.log_access_event('USER_INVITED', v_account, _tournament_id, NULL, v_email, NULL, _role);

  -- Existing user: grant membership directly, no duplicate account
  SELECT id INTO v_existing FROM app_users WHERE lower(email) = v_email;
  IF v_existing IS NOT NULL THEN
    IF _tournament_id IS NOT NULL THEN
      INSERT INTO tournament_memberships (tournament_id, user_id, role, invited_by) VALUES (_tournament_id, v_existing, _role, auth.uid())
      ON CONFLICT (tournament_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by;
      PERFORM public.log_access_event('TOURNAMENT_ACCESS_GRANTED', v_account, _tournament_id, v_existing, v_email, NULL, _role);
    ELSE
      IF v_existing = v_account THEN RAISE EXCEPTION 'That person already owns this workspace'; END IF;
      INSERT INTO account_memberships (account_id, user_id, role, invited_by) VALUES (v_account, v_existing, _role, auth.uid())
      ON CONFLICT (account_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by;
      PERFORM public.log_access_event('ACCOUNT_ROLE_CHANGED', v_account, NULL, v_existing, v_email, NULL, _role);
    END IF;
    UPDATE invitations SET status = 'accepted', accepted_by = v_existing, accepted_at = now() WHERE id = v_id;
    RETURN jsonb_build_object('id', v_id, 'status', 'added', 'token', NULL);
  END IF;
  RETURN jsonb_build_object('id', v_id, 'status', 'pending', 'token', v_token);
END $$;

CREATE OR REPLACE FUNCTION public.can_manage_invitation(_inv public.invitations)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _inv.tournament_id IS NOT NULL THEN public.has_tournament_permission(_inv.tournament_id, 'users.invite')
              ELSE public.has_account_permission(_inv.account_id, 'account.users.invite') END
$$;

CREATE OR REPLACE FUNCTION public.resend_invitation(_id uuid, _days integer DEFAULT 7)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_inv invitations; v_token text;
BEGIN
  SELECT * INTO v_inv FROM invitations WHERE id = _id;
  IF v_inv.id IS NULL OR NOT public.can_manage_invitation(v_inv) THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF v_inv.status = 'accepted' THEN RAISE EXCEPTION 'This invitation was already accepted'; END IF;
  v_token := encode(gen_random_bytes(32), 'hex');
  UPDATE invitations SET token_hash = encode(digest(v_token, 'sha256'), 'hex'), status = 'pending',
    expires_at = now() + make_interval(days => GREATEST(1, LEAST(COALESCE(_days, 7), 60))) WHERE id = _id;
  PERFORM public.log_access_event('INVITATION_RESENT', v_inv.account_id, v_inv.tournament_id, NULL, v_inv.email, NULL, v_inv.role);
  RETURN v_token;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_invitation(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv invitations;
BEGIN
  SELECT * INTO v_inv FROM invitations WHERE id = _id;
  IF v_inv.id IS NULL OR NOT public.can_manage_invitation(v_inv) THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  UPDATE invitations SET status = 'revoked' WHERE id = _id AND status = 'pending';
  PERFORM public.log_access_event('INVITATION_REVOKED', v_inv.account_id, v_inv.tournament_id, NULL, v_inv.email, v_inv.role, NULL);
END $$;

CREATE OR REPLACE FUNCTION public.get_invitation(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_inv invitations; v_name text;
BEGIN
  SELECT * INTO v_inv FROM invitations WHERE token_hash = encode(digest(_token, 'sha256'), 'hex');
  IF v_inv.id IS NULL THEN RETURN jsonb_build_object('status', 'invalid'); END IF;
  IF v_inv.status = 'pending' AND v_inv.expires_at < now() THEN
    UPDATE invitations SET status = 'expired' WHERE id = v_inv.id; v_inv.status := 'expired';
  END IF;
  SELECT name INTO v_name FROM tournaments WHERE id = v_inv.tournament_id;
  RETURN jsonb_build_object('status', v_inv.status, 'email', v_inv.email, 'role', v_inv.role,
    'tournament_name', v_name, 'tournament_id', v_inv.tournament_id, 'message', v_inv.message, 'expires_at', v_inv.expires_at);
END $$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_inv invitations; v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO v_inv FROM invitations WHERE token_hash = encode(digest(_token, 'sha256'), 'hex') FOR UPDATE;
  IF v_inv.id IS NULL OR v_inv.status IN ('revoked') THEN RAISE EXCEPTION 'This invitation is no longer valid.'; END IF;
  IF v_inv.status = 'accepted' THEN RAISE EXCEPTION 'This invitation has already been used.'; END IF;
  IF v_inv.status = 'expired' OR v_inv.expires_at < now() THEN
    UPDATE invitations SET status = 'expired' WHERE id = v_inv.id;
    RAISE EXCEPTION 'This invitation has expired. Please request a new invitation.';
  END IF;
  IF v_email <> v_inv.email THEN RAISE EXCEPTION 'This invitation was sent to %. Sign in with that email to accept it.', v_inv.email; END IF;

  IF v_inv.tournament_id IS NOT NULL THEN
    INSERT INTO tournament_memberships (tournament_id, user_id, role, invited_by) VALUES (v_inv.tournament_id, auth.uid(), v_inv.role, v_inv.invited_by)
    ON CONFLICT (tournament_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active';
  ELSE
    INSERT INTO account_memberships (account_id, user_id, role, invited_by) VALUES (v_inv.account_id, auth.uid(), v_inv.role, v_inv.invited_by)
    ON CONFLICT (account_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active';
  END IF;
  UPDATE invitations SET status = 'accepted', accepted_by = auth.uid(), accepted_at = now() WHERE id = v_inv.id;
  PERFORM public.log_access_event('INVITATION_ACCEPTED', v_inv.account_id, v_inv.tournament_id, auth.uid(), v_email, NULL, v_inv.role);
  RETURN jsonb_build_object('tournament_id', v_inv.tournament_id, 'account_id', v_inv.account_id);
END $$;

-- ---------------- Membership management ----------------
CREATE OR REPLACE FUNCTION public.list_tournament_access(_tournament_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_tournament_permission(_tournament_id, 'users.view') THEN
    RAISE EXCEPTION 'You have access to this tournament, but you don''t have permission to perform this action.'; END IF;
  RETURN jsonb_build_object(
    'owner_id', (SELECT owner_id FROM tournaments WHERE id = _tournament_id),
    'members', COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', tm.user_id, 'email', u.email, 'role', tm.role,
        'added_by', ib.email, 'created_at', tm.created_at) ORDER BY tm.created_at)
      FROM tournament_memberships tm LEFT JOIN app_users u ON u.id = tm.user_id LEFT JOIN app_users ib ON ib.id = tm.invited_by
      WHERE tm.tournament_id = _tournament_id AND tm.status = 'active'), '[]'),
    'invitations', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'email', i.email, 'role', i.role,
        'status', CASE WHEN i.status = 'pending' AND i.expires_at < now() THEN 'expired' ELSE i.status END,
        'invited_by', ib.email, 'expires_at', i.expires_at, 'created_at', i.created_at) ORDER BY i.created_at DESC)
      FROM invitations i LEFT JOIN app_users ib ON ib.id = i.invited_by
      WHERE i.tournament_id = _tournament_id AND i.status IN ('pending','expired','revoked')), '[]'));
END $$;

CREATE OR REPLACE FUNCTION public.set_tournament_member_role(_tournament_id uuid, _user_id uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old text; v_owner uuid;
BEGIN
  IF NOT public.has_tournament_permission(_tournament_id, 'users.manage_roles') THEN
    RAISE EXCEPTION 'You have access to this tournament, but you don''t have permission to perform this action.'; END IF;
  IF _role NOT IN ('tournament_admin','tournament_editor','scorekeeper','statistician','tournament_viewer') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT owner_id INTO v_owner FROM tournaments WHERE id = _tournament_id;
  IF _user_id = v_owner THEN RAISE EXCEPTION 'The tournament owner always stays an administrator.'; END IF;
  SELECT role INTO v_old FROM tournament_memberships WHERE tournament_id = _tournament_id AND user_id = _user_id AND status = 'active';
  IF v_old IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  UPDATE tournament_memberships SET role = _role WHERE tournament_id = _tournament_id AND user_id = _user_id;
  PERFORM public.log_access_event('ROLE_CHANGED', v_owner, _tournament_id, _user_id, NULL, v_old, _role);
END $$;

CREATE OR REPLACE FUNCTION public.remove_tournament_member(_tournament_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old text; v_owner uuid;
BEGIN
  IF NOT public.has_tournament_permission(_tournament_id, 'users.remove') THEN
    RAISE EXCEPTION 'You have access to this tournament, but you don''t have permission to perform this action.'; END IF;
  SELECT owner_id INTO v_owner FROM tournaments WHERE id = _tournament_id;
  IF _user_id = v_owner THEN RAISE EXCEPTION 'This tournament must have at least one administrator. The owner cannot be removed.'; END IF;
  SELECT role INTO v_old FROM tournament_memberships WHERE tournament_id = _tournament_id AND user_id = _user_id AND status = 'active';
  IF v_old IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  DELETE FROM tournament_memberships WHERE tournament_id = _tournament_id AND user_id = _user_id;
  PERFORM public.log_access_event('TOURNAMENT_ACCESS_REMOVED', v_owner, _tournament_id, _user_id, NULL, v_old, NULL);
END $$;

CREATE OR REPLACE FUNCTION public.list_my_accounts()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_id', am.account_id, 'role', am.role,
    'name', COALESCE(o.brand_name, o.name, u.email)) ORDER BY (am.account_id = auth.uid()) DESC), '[]')
  FROM account_memberships am LEFT JOIN app_users u ON u.id = am.account_id
  LEFT JOIN LATERAL (SELECT name, brand_name FROM organizations WHERE owner_id = am.account_id LIMIT 1) o ON true
  WHERE am.user_id = auth.uid() AND am.status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.list_account_access(_account_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_account_permission(_account_id, 'account.users.view') THEN
    RAISE EXCEPTION 'You don''t have permission to manage this workspace.'; END IF;
  RETURN jsonb_build_object(
    'members', COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', am.user_id, 'email', u.email, 'role', am.role, 'created_at', am.created_at,
        'tournaments', COALESCE((SELECT jsonb_agg(jsonb_build_object('tournament_id', t.id, 'name', t.name, 'role', tm.role) ORDER BY t.name)
          FROM tournament_memberships tm JOIN tournaments t ON t.id = tm.tournament_id
          WHERE tm.user_id = am.user_id AND tm.status = 'active' AND t.owner_id = _account_id), '[]')) ORDER BY am.created_at)
      FROM account_memberships am LEFT JOIN app_users u ON u.id = am.user_id
      WHERE am.account_id = _account_id AND am.status = 'active'), '[]'),
    'tournament_only', COALESCE((SELECT jsonb_agg(x) FROM (
        SELECT jsonb_build_object('user_id', tm.user_id, 'email', u.email,
          'tournaments', jsonb_agg(jsonb_build_object('tournament_id', t.id, 'name', t.name, 'role', tm.role) ORDER BY t.name)) x
        FROM tournament_memberships tm JOIN tournaments t ON t.id = tm.tournament_id LEFT JOIN app_users u ON u.id = tm.user_id
        WHERE t.owner_id = _account_id AND tm.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM account_memberships am WHERE am.account_id = _account_id AND am.user_id = tm.user_id AND am.status = 'active')
        GROUP BY tm.user_id, u.email) s), '[]'),
    'invitations', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'email', i.email, 'role', i.role, 'tournament_name', t.name,
        'status', CASE WHEN i.status = 'pending' AND i.expires_at < now() THEN 'expired' ELSE i.status END,
        'invited_by', ib.email, 'expires_at', i.expires_at) ORDER BY i.created_at DESC)
      FROM invitations i LEFT JOIN tournaments t ON t.id = i.tournament_id LEFT JOIN app_users ib ON ib.id = i.invited_by
      WHERE i.account_id = _account_id AND i.status IN ('pending','expired')), '[]'));
END $$;

CREATE OR REPLACE FUNCTION public.set_account_member_role(_account_id uuid, _user_id uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old text;
BEGIN
  IF NOT public.has_account_permission(_account_id, 'account.users.manage') THEN RAISE EXCEPTION 'You don''t have permission to manage this workspace.'; END IF;
  IF _role NOT IN ('account_admin','account_member','account_viewer') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF _user_id = _account_id THEN RAISE EXCEPTION 'The workspace owner cannot be changed without an ownership transfer.'; END IF;
  IF _role = 'account_admin' AND _account_id <> auth.uid() THEN RAISE EXCEPTION 'Only the workspace owner can promote admins'; END IF;
  SELECT role INTO v_old FROM account_memberships WHERE account_id = _account_id AND user_id = _user_id AND status = 'active';
  IF v_old IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF v_old = 'account_admin' AND _account_id <> auth.uid() THEN RAISE EXCEPTION 'Only the workspace owner can change an admin'; END IF;
  UPDATE account_memberships SET role = _role WHERE account_id = _account_id AND user_id = _user_id;
  PERFORM public.log_access_event('ACCOUNT_ROLE_CHANGED', _account_id, NULL, _user_id, NULL, v_old, _role);
END $$;

CREATE OR REPLACE FUNCTION public.remove_account_member(_account_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old text;
BEGIN
  IF NOT public.has_account_permission(_account_id, 'account.users.manage') THEN RAISE EXCEPTION 'You don''t have permission to manage this workspace.'; END IF;
  IF _user_id = _account_id THEN RAISE EXCEPTION 'The workspace owner cannot be removed.'; END IF;
  SELECT role INTO v_old FROM account_memberships WHERE account_id = _account_id AND user_id = _user_id;
  IF v_old = 'account_admin' AND _account_id <> auth.uid() THEN RAISE EXCEPTION 'Only the workspace owner can remove an admin'; END IF;
  DELETE FROM account_memberships WHERE account_id = _account_id AND user_id = _user_id;
  -- no orphaned access: drop their memberships in this workspace's tournaments (history rows are kept)
  DELETE FROM tournament_memberships tm USING tournaments t
    WHERE t.id = tm.tournament_id AND t.owner_id = _account_id AND tm.user_id = _user_id;
  PERFORM public.log_access_event('ACCOUNT_ACCESS_REMOVED', _account_id, NULL, _user_id, NULL, v_old, NULL);
END $$;

-- ---------------- Execution grants ----------------
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'has_account_permission(uuid,text)','has_tournament_permission(uuid,text)','my_tournament_permissions(uuid)','my_accessible_tournaments()',
    'create_invitation(uuid,uuid,text,text,integer,text)','resend_invitation(uuid,integer)','revoke_invitation(uuid)','get_invitation(text)',
    'accept_invitation(text)','list_tournament_access(uuid)','set_tournament_member_role(uuid,uuid,text)','remove_tournament_member(uuid,uuid)',
    'list_my_accounts()','list_account_access(uuid)','set_account_member_role(uuid,uuid,text)','remove_account_member(uuid,uuid)',
    'can_manage_invitation(public.invitations)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.set_child_owner_from_tournament() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_match_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_tournament_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_app_user_created() FROM PUBLIC, anon, authenticated;
