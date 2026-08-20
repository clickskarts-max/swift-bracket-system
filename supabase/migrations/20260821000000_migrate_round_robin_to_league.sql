-- 1. Update the specific tournament format to 'league'
UPDATE public.tournaments
SET format = 'league'
WHERE id = 'b524ae7e-553a-4125-bf6e-c50c46b8c1ba';

-- 2. Update any other 'round_robin' tournaments to 'league' (as they are conceptually the same)
UPDATE public.tournaments
SET format = 'league'
WHERE format = 'round_robin';

-- 3. Update the check constraint on the tournaments table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'tournaments' AND constraint_name = 'tournaments_format_check'
    ) THEN
        ALTER TABLE public.tournaments DROP CONSTRAINT tournaments_format_check;
    END IF;
    
    ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_format_check 
    CHECK (format IN ('league', 'group_knockout', 'single_elimination', 'double_elimination'));
END $$;
