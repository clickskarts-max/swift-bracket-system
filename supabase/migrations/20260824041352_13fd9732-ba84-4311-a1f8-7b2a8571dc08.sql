-- Ensure all advertising tables exist and have proper RLS

-- 1. ad_campaigns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ad_campaigns') THEN
        CREATE TABLE public.ad_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            name TEXT NOT NULL,
            advertiser TEXT,
            status TEXT DEFAULT 'draft',
            priority TEXT DEFAULT 'normal',
            weight INTEGER DEFAULT 10,
            targeting JSONB DEFAULT '{}'::jsonb,
            allow_auto_placement BOOLEAN DEFAULT true,
            start_date TIMESTAMPTZ,
            end_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
        
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO authenticated;
        GRANT ALL ON public.ad_campaigns TO service_role;
        GRANT SELECT ON public.ad_campaigns TO anon;

        CREATE POLICY "Users can manage their own campaigns"
        ON public.ad_campaigns FOR ALL TO authenticated
        USING (auth.uid() = owner_id);

        CREATE POLICY "Public can view active campaigns"
        ON public.ad_campaigns FOR SELECT TO anon
        USING (status = 'active');
    ELSE
        -- Add allow_auto_placement if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ad_campaigns' AND column_name='allow_auto_placement') THEN
            ALTER TABLE public.ad_campaigns ADD COLUMN allow_auto_placement BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- 2. ad_creatives
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ad_creatives') THEN
        CREATE TABLE public.ad_creatives (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'image',
            media_url TEXT NOT NULL,
            destination_url TEXT,
            width INTEGER,
            height INTEGER,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
        
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_creatives TO authenticated;
        GRANT ALL ON public.ad_creatives TO service_role;
        GRANT SELECT ON public.ad_creatives TO anon;

        CREATE POLICY "Users can manage their own creatives"
        ON public.ad_creatives FOR ALL TO authenticated
        USING (auth.uid() = owner_id);

        CREATE POLICY "Public can view creatives for active campaigns"
        ON public.ad_creatives FOR SELECT TO anon
        USING (EXISTS (
            SELECT 1 FROM ad_campaigns 
            WHERE ad_campaigns.id = ad_creatives.campaign_id 
            AND ad_campaigns.status = 'active'
        ));
    END IF;
END $$;

-- 3. ad_placements
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ad_placements') THEN
        CREATE TABLE public.ad_placements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            key TEXT UNIQUE NOT NULL,
            label TEXT NOT NULL,
            enabled BOOLEAN DEFAULT true,
            allowed_sizes JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
        
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_placements TO authenticated;
        GRANT ALL ON public.ad_placements TO service_role;
        GRANT SELECT ON public.ad_placements TO anon;

        CREATE POLICY "Authenticated users can manage placements"
        ON public.ad_placements FOR ALL TO authenticated
        USING (true);

        CREATE POLICY "Public can view placements"
        ON public.ad_placements FOR SELECT TO anon
        USING (enabled = true);

        -- Seed initial placements
        INSERT INTO public.ad_placements (key, label, allowed_sizes) VALUES
        ('homepage-spotlight', 'Homepage Spotlight', '[{"w": 1200, "h": 200}]'),
        ('tournament-header', 'Tournament Header', '[{"w": 728, "h": 90}]'),
        ('fixtures-feed', 'Fixtures Feed', '[{"w": 300, "h": 250}, {"w": 728, "h": 90}]'),
        ('standings-sidebar', 'Standings Sidebar', '[{"w": 300, "h": 250}, {"w": 300, "h": 600}]');
    END IF;
END $$;

-- 4. ad_analytics
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ad_analytics') THEN
        CREATE TABLE public.ad_analytics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
            creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE CASCADE NOT NULL,
            placement_id UUID REFERENCES public.ad_placements(id) ON DELETE SET NULL,
            tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
            type TEXT NOT NULL, -- impression, click
            page TEXT,
            timestamp TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;
        
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_analytics TO authenticated;
        GRANT ALL ON public.ad_analytics TO service_role;
        GRANT INSERT ON public.ad_analytics TO anon;
        GRANT SELECT ON public.ad_analytics TO anon;

        CREATE POLICY "Users can view their campaign analytics"
        ON public.ad_analytics FOR SELECT TO authenticated
        USING (EXISTS (
            SELECT 1 FROM ad_campaigns 
            WHERE ad_campaigns.id = ad_analytics.campaign_id 
            AND ad_campaigns.owner_id = auth.uid()
        ));

        CREATE POLICY "Public can insert analytics"
        ON public.ad_analytics FOR INSERT TO anon
        WITH CHECK (true);
    END IF;
END $$;

-- 5. ad_settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ad_settings') THEN
        CREATE TABLE public.ad_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            auto_placement_enabled BOOLEAN DEFAULT true,
            auto_placement_intensity TEXT DEFAULT 'balanced', -- low, balanced, high
            public_ads_enabled BOOLEAN DEFAULT true,
            page_rules JSONB DEFAULT '{
                "homepage": true,
                "tournament_overview": true,
                "fixtures": true,
                "standings": true,
                "teams": true,
                "knockout": true,
                "pool_draw": false
            }'::jsonb,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(owner_id)
        );

        ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;
        
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_settings TO authenticated;
        GRANT ALL ON public.ad_settings TO service_role;
        GRANT SELECT ON public.ad_settings TO anon;

        CREATE POLICY "Owners can manage their ad settings"
        ON public.ad_settings FOR ALL TO authenticated
        USING (auth.uid() = owner_id);

        CREATE POLICY "Public can read ad settings"
        ON public.ad_settings FOR SELECT TO anon
        USING (public_ads_enabled = true);
    END IF;
END $$;