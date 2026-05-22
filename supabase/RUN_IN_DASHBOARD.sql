-- Coller ce script dans Supabase → SQL Editor → Run (une seule fois)
-- Puis recharger l'app (npm run dev)

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS emojis_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS target_age_range TEXT DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS custom_color_primary TEXT,
  ADD COLUMN IF NOT EXISTS custom_color_background TEXT,
  ADD COLUMN IF NOT EXISTS custom_color_text TEXT,
  ADD COLUMN IF NOT EXISTS theme_config JSONB;

ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS customer_birth_month INTEGER,
  ADD COLUMN IF NOT EXISTS customer_birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS redemption_code TEXT;

UPDATE public.quizzes SET theme = COALESCE(theme, 'modern') WHERE theme IS NULL;
UPDATE public.quizzes SET emojis_enabled = COALESCE(emojis_enabled, true) WHERE emojis_enabled IS NULL;
UPDATE public.quizzes SET target_age_range = COALESCE(target_age_range, 'mixed') WHERE target_age_range IS NULL;

CREATE OR REPLACE FUNCTION public.scano_ensure_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE public.quizzes
    ADD COLUMN IF NOT EXISTS business_description TEXT,
    ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'modern',
    ADD COLUMN IF NOT EXISTS emojis_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS target_age_range TEXT DEFAULT 'mixed',
    ADD COLUMN IF NOT EXISTS custom_color_primary TEXT,
    ADD COLUMN IF NOT EXISTS custom_color_background TEXT,
    ADD COLUMN IF NOT EXISTS custom_color_text TEXT,
    ADD COLUMN IF NOT EXISTS theme_config JSONB;
  ALTER TABLE public.responses
    ADD COLUMN IF NOT EXISTS customer_birth_month INTEGER,
    ADD COLUMN IF NOT EXISTS customer_birth_year INTEGER,
    ADD COLUMN IF NOT EXISTS redemption_code TEXT;
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

GRANT EXECUTE ON FUNCTION public.scano_ensure_schema() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
