-- Colonnes quiz / réponses (idempotent — safe si déjà partiellement appliqué)

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS emojis_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS target_age_range TEXT DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS custom_color_primary TEXT,
  ADD COLUMN IF NOT EXISTS custom_color_background TEXT,
  ADD COLUMN IF NOT EXISTS custom_color_text TEXT;

-- Compatibilité versions précédentes du code (JSON thème custom)
ALTER TABLE public.quizzes
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

-- Valeurs par défaut sur lignes existantes
UPDATE public.quizzes SET theme = COALESCE(theme, 'modern') WHERE theme IS NULL;
UPDATE public.quizzes SET emojis_enabled = COALESCE(emojis_enabled, true) WHERE emojis_enabled IS NULL;
UPDATE public.quizzes SET target_age_range = COALESCE(target_age_range, 'mixed') WHERE target_age_range IS NULL;

COMMENT ON COLUMN public.quizzes.theme IS 'modern | bold | warm | nature | industrial | custom';
COMMENT ON COLUMN public.quizzes.target_age_range IS '18-25 | 26-35 | 36-50 | 50+ | mixed';
COMMENT ON COLUMN public.quizzes.custom_color_primary IS 'Accent (#FFD60A par défaut) si theme=custom';
COMMENT ON COLUMN public.quizzes.custom_color_background IS 'Fond si theme=custom';
COMMENT ON COLUMN public.quizzes.custom_color_text IS 'Texte si theme=custom';

-- RPC appelable depuis l'app (anon) pour appliquer le schéma si migrations pas encore passées
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
