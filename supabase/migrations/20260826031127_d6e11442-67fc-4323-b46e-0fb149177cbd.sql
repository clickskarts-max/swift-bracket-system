CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL,
  display_name text,
  enabled boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'disconnected',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_owner_select" ON public.integrations FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "integrations_owner_insert" ON public.integrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "integrations_owner_update" ON public.integrations FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "integrations_owner_delete" ON public.integrations FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.integration_credentials (
  integration_id uuid PRIMARY KEY REFERENCES public.integrations(id) ON DELETE CASCADE,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.integration_credentials TO service_role;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, event_id)
);
GRANT SELECT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_events_owner_select" ON public.integration_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.integrations i WHERE i.id = integration_id AND i.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'sync',
  status text NOT NULL DEFAULT 'running',
  items_processed integer NOT NULL DEFAULT 0,
  message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.integration_sync_runs TO authenticated;
GRANT ALL ON public.integration_sync_runs TO service_role;
ALTER TABLE public.integration_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_runs_owner_select" ON public.integration_sync_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.integrations i WHERE i.id = integration_id AND i.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS integration_events_integration_idx ON public.integration_events (integration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS integration_runs_integration_idx ON public.integration_sync_runs (integration_id, started_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS integrations_set_updated_at ON public.integrations;
CREATE TRIGGER integrations_set_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();