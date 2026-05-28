-- New merchants should not get an active plan by default.
ALTER TABLE public.merchants
  ALTER COLUMN plan DROP DEFAULT,
  ALTER COLUMN plan DROP NOT NULL;
