-- Coller dans Supabase → SQL Editor → Run

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS objective_target TEXT,
  ADD COLUMN IF NOT EXISTS objective_date DATE;

COMMENT ON COLUMN public.merchants.objective IS 'loyalty | rating | acquisition | revenue | friction';
COMMENT ON COLUMN public.merchants.objective_target IS 'Objectif chiffré libre (ex: Atteindre 8/10)';
COMMENT ON COLUMN public.merchants.objective_date IS 'Date cible optionnelle';

NOTIFY pgrst, 'reload schema';
