-- Public quiz access for anonymous customers

CREATE POLICY "quizzes_public_read" ON public.quizzes
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "merchants_public_read" ON public.merchants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "responses_public_insert" ON public.responses
  FOR INSERT
  TO anon
  WITH CHECK (true);
