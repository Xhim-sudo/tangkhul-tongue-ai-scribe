-- Clear existing training data first
TRUNCATE TABLE public.training_entries CASCADE;
TRUNCATE TABLE public.accuracy_metrics CASCADE;
TRUNCATE TABLE public.contributor_datasets CASCADE;

-- Enable real-time for existing training categories
ALTER TABLE public.training_categories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_categories;

-- Now create the new training submissions log table
CREATE TABLE public.training_submissions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id UUID NOT NULL,
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  category TEXT NOT NULL,
  context TEXT,
  tags TEXT[],
  submission_hash TEXT NOT NULL,
  is_consensus_correct BOOLEAN DEFAULT NULL,
  confidence_score INTEGER DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  validator_id UUID
);

-- Enable RLS and real-time for submissions log
ALTER TABLE public.training_submissions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_submissions_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_submissions_log;

-- RLS policies for training submissions log
CREATE POLICY "Contributors can view their own submissions" 
  ON public.training_submissions_log 
  FOR SELECT 
  USING (contributor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role));

CREATE POLICY "Contributors can create submissions" 
  ON public.training_submissions_log 
  FOR INSERT 
  WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Experts can update submissions" 
  ON public.training_submissions_log 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role));

-- Create consensus tracking table
CREATE TABLE public.translation_consensus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  agreement_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  is_golden_data BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(english_text, tangkhul_text)
);

-- Enable RLS on consensus table
ALTER TABLE public.translation_consensus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view consensus data" 
  ON public.translation_consensus 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can manage consensus data" 
  ON public.translation_consensus 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role));

-- Create function to get community stats
CREATE OR REPLACE FUNCTION public.get_community_stats()
RETURNS TABLE (
  total_submissions BIGINT,
  total_contributors BIGINT,
  consensus_translations BIGINT,
  golden_data_count BIGINT,
  average_accuracy NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.training_submissions_log) as total_submissions,
    (SELECT COUNT(DISTINCT contributor_id) FROM public.training_submissions_log) as total_contributors,
    (SELECT COUNT(*) FROM public.translation_consensus WHERE agreement_score >= 80) as consensus_translations,
    (SELECT COUNT(*) FROM public.translation_consensus WHERE is_golden_data = true) as golden_data_count,
    (SELECT COALESCE(AVG(agreement_score), 0) FROM public.translation_consensus) as average_accuracy;
$$;