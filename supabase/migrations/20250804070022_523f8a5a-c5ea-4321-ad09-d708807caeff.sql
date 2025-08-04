-- Clear ALL existing training data and start from zero
TRUNCATE TABLE public.training_entries CASCADE;
TRUNCATE TABLE public.accuracy_metrics CASCADE;
TRUNCATE TABLE public.contributor_datasets CASCADE;
TRUNCATE TABLE public.training_submissions_log CASCADE;
TRUNCATE TABLE public.translation_consensus CASCADE;

-- Enable real-time for training submissions and categories
ALTER TABLE public.training_submissions_log REPLICA IDENTITY FULL;
ALTER TABLE public.training_categories REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_submissions_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_categories;

-- Create enhanced training submissions view for admin monitoring
CREATE OR REPLACE VIEW public.training_submissions_view AS
SELECT 
  tsl.*,
  p.full_name as contributor_name,
  p.email as contributor_email,
  tc.agreement_score,
  tc.submission_count,
  tc.is_golden_data
FROM public.training_submissions_log tsl
LEFT JOIN public.profiles p ON tsl.contributor_id = p.id
LEFT JOIN public.translation_consensus tc ON tsl.english_text = tc.english_text 
  AND tsl.tangkhul_text = tc.tangkhul_text
ORDER BY tsl.created_at DESC;

-- Create policy for admin view
CREATE POLICY "Admins can view training submissions view" 
  ON public.training_submissions_log 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role));

-- Create function to get community stats in real-time
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