
-- 1) Add grammar usage JSON to knowledge log submissions
ALTER TABLE public.training_submissions_log
ADD COLUMN IF NOT EXISTS grammatical_features jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Helpful indexes for faster matching and lookups
-- Text indexes for case-insensitive comparisons
CREATE INDEX IF NOT EXISTS training_submissions_log_lower_english_idx
  ON public.training_submissions_log (lower(english_text));
CREATE INDEX IF NOT EXISTS training_submissions_log_lower_tangkhul_idx
  ON public.training_submissions_log (lower(tangkhul_text));

-- JSON GIN index for flexible grammar feature queries
CREATE INDEX IF NOT EXISTS training_submissions_log_grammatical_features_gin
  ON public.training_submissions_log USING GIN (grammatical_features);

-- Optional: mirror helpful indexes on training_entries to improve similarity/filters
CREATE INDEX IF NOT EXISTS training_entries_lower_english_idx
  ON public.training_entries (lower(english_text));
CREATE INDEX IF NOT EXISTS training_entries_lower_tangkhul_idx
  ON public.training_entries (lower(tangkhul_text));
CREATE INDEX IF NOT EXISTS training_entries_grammatical_features_gin
  ON public.training_entries USING GIN (grammatical_features);
