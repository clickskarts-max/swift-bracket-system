-- Add white-labeling support to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS footer_text TEXT,
ADD COLUMN IF NOT EXISTS powered_by_enabled BOOLEAN DEFAULT true;

-- Ensure RLS is correctly set up for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can view their own organization'
    ) THEN
        CREATE POLICY "Users can view their own organization" ON public.organizations
        FOR SELECT TO authenticated USING (auth.uid() = owner_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can update their own organization'
    ) THEN
        CREATE POLICY "Users can update their own organization" ON public.organizations
        FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can insert their own organization'
    ) THEN
        CREATE POLICY "Users can insert their own organization" ON public.organizations
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    -- Allow public read by domain/ID for white-labeling
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Allow public select for white-labeling'
    ) THEN
        CREATE POLICY "Allow public select for white-labeling" ON public.organizations
        FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;
GRANT ALL ON public.organizations TO service_role;
