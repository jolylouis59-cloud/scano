-- Leads capturés depuis le quiz builder de la landing (visiteurs qui testent)
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
