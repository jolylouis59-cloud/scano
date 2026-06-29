-- Coller dans Supabase → SQL Editor si la migration n'a pas été appliquée
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS google_review_url TEXT;

COMMENT ON COLUMN public.merchants.google_review_url IS 'Lien public Google Avis (Maps / g.page) pour redirection clients satisfaits';
