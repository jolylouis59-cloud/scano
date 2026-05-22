-- Coller dans Supabase → SQL Editor → Run

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS promo_code TEXT;

COMMENT ON COLUMN public.quizzes.promo_code IS 'Code promo affiché à l''écran final du quiz client (ex: CAFE2026)';

NOTIFY pgrst, 'reload schema';
