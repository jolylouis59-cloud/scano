-- Coller dans Supabase → SQL Editor → Run

ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS redemption_code TEXT;

COMMENT ON COLUMN public.responses.redemption_code IS 'Code unique SCANO-XXXXXX généré à la fin du quiz';

NOTIFY pgrst, 'reload schema';
