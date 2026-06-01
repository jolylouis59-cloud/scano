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
  ADD COLUMN IF NOT EXISTS theme_config JSONB,
  ADD COLUMN IF NOT EXISTS promo_code TEXT;

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS objective_target TEXT,
  ADD COLUMN IF NOT EXISTS objective_date DATE;
ALTER TABLE public.merchants
  ALTER COLUMN plan DROP DEFAULT,
  ALTER COLUMN plan DROP NOT NULL;

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
    ADD COLUMN IF NOT EXISTS theme_config JSONB,
    ADD COLUMN IF NOT EXISTS promo_code TEXT;
  ALTER TABLE public.merchants
    ADD COLUMN IF NOT EXISTS objective TEXT,
    ADD COLUMN IF NOT EXISTS objective_target TEXT,
    ADD COLUMN IF NOT EXISTS objective_date DATE;
  ALTER TABLE public.merchants
    ALTER COLUMN plan DROP DEFAULT,
    ALTER COLUMN plan DROP NOT NULL;
  ALTER TABLE public.responses
    ADD COLUMN IF NOT EXISTS customer_birth_month INTEGER,
    ADD COLUMN IF NOT EXISTS customer_birth_year INTEGER,
    ADD COLUMN IF NOT EXISTS redemption_code TEXT;
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

GRANT EXECUTE ON FUNCTION public.scano_ensure_schema() TO anon, authenticated, service_role;

-- Leads (quiz builder landing)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;
CREATE POLICY "leads_anon_insert" ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(email)) >= 5
    AND position('@' in trim(email)) > 1
  );

NOTIFY pgrst, 'reload schema';
