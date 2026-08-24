ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS show_logo_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_name_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact_public boolean NOT NULL DEFAULT false;