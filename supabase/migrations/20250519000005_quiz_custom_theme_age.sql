ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS theme_config JSONB,
  ADD COLUMN IF NOT EXISTS target_age_range TEXT NOT NULL DEFAULT 'mixed';

COMMENT ON COLUMN public.quizzes.theme_config IS 'Couleurs personnalisées si theme=custom : { accent, bg, fg }';
COMMENT ON COLUMN public.quizzes.target_age_range IS '18-25 | 26-35 | 36-50 | 50+ | mixed';
