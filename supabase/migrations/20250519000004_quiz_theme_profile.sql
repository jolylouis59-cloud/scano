-- Quiz: thème visuel, description entreprise, emojis
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS emojis_enabled BOOLEAN NOT NULL DEFAULT true;

-- Réponses: date de naissance (mois + année)
ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS customer_birth_month INTEGER,
  ADD COLUMN IF NOT EXISTS customer_birth_year INTEGER;

COMMENT ON COLUMN public.quizzes.theme IS 'modern | bold | warm | nature | industrial';
COMMENT ON COLUMN public.quizzes.emojis_enabled IS 'false pour secteurs pro sans emojis dans le quiz généré';
