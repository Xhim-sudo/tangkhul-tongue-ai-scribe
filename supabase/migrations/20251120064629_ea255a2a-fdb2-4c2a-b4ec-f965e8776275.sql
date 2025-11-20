-- Fix missing columns in translation_consensus
ALTER TABLE public.translation_consensus
ADD COLUMN IF NOT EXISTS is_golden_data BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0;

-- Create whatsapp_logs table for WhatsApp integration
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_whatsapp_logs_user ON public.whatsapp_logs(user_id);
CREATE INDEX idx_whatsapp_logs_created ON public.whatsapp_logs(created_at DESC);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whatsapp logs"
  ON public.whatsapp_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all whatsapp logs"
  ON public.whatsapp_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert whatsapp logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (true);

-- Move pg_trgm extension to extensions schema (fix security warning)
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Recreate GIN indexes with correct extension schema
DROP INDEX IF EXISTS public.idx_training_entries_english;
DROP INDEX IF EXISTS public.idx_training_entries_tangkhul;

CREATE INDEX idx_training_entries_english 
  ON public.training_entries USING gin(english_text extensions.gin_trgm_ops);

CREATE INDEX idx_training_entries_tangkhul 
  ON public.training_entries USING gin(tangkhul_text extensions.gin_trgm_ops);

-- Update calculate_similarity function to use correct schema
CREATE OR REPLACE FUNCTION public.calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN extensions.similarity(text1, text2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';