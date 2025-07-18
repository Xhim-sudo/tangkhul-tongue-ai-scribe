
-- Clear existing training data
TRUNCATE TABLE public.training_entries CASCADE;
TRUNCATE TABLE public.contributor_datasets CASCADE;
TRUNCATE TABLE public.accuracy_metrics CASCADE;

-- Create training categories table for dynamic category management
CREATE TABLE public.training_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on training categories
ALTER TABLE public.training_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for training categories
CREATE POLICY "Anyone can view active categories" 
  ON public.training_categories 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
  ON public.training_categories 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create training submissions log table for detailed tracking
CREATE TABLE public.training_submissions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id UUID NOT NULL,
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  category TEXT NOT NULL,
  context TEXT,
  tags TEXT[],
  submission_hash TEXT NOT NULL, -- Hash of english_text for grouping similar submissions
  is_consensus_correct BOOLEAN DEFAULT NULL, -- NULL = pending, true/false = determined by consensus
  confidence_score INTEGER DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  validator_id UUID
);

-- Enable RLS on training submissions log
ALTER TABLE public.training_submissions_log ENABLE ROW LEVEL SECURITY;

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
  agreement_score NUMERIC(5,2) NOT NULL DEFAULT 0.00, -- Percentage agreement
  is_golden_data BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(english_text, tangkhul_text)
);

-- Enable RLS on consensus table
ALTER TABLE public.translation_consensus ENABLE ROW LEVEL SECURITY;

-- RLS policies for consensus table
CREATE POLICY "Everyone can view consensus data" 
  ON public.translation_consensus 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can manage consensus data" 
  ON public.translation_consensus 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'expert'::app_role));

-- Insert default categories
INSERT INTO public.training_categories (name, description, created_by) VALUES
('greetings', 'Common greetings and salutations', (SELECT id FROM auth.users LIMIT 1)),
('expressions', 'Common expressions and phrases', (SELECT id FROM auth.users LIMIT 1)),
('numbers', 'Numbers and counting', (SELECT id FROM auth.users LIMIT 1)),
('colors', 'Colors and descriptions', (SELECT id FROM auth.users LIMIT 1)),
('family', 'Family relationships and terms', (SELECT id FROM auth.users LIMIT 1)),
('food', 'Food items and cooking terms', (SELECT id FROM auth.users LIMIT 1)),
('nature', 'Nature, animals, and environment', (SELECT id FROM auth.users LIMIT 1)),
('time', 'Time, dates, and seasons', (SELECT id FROM auth.users LIMIT 1)),
('directions', 'Directions and locations', (SELECT id FROM auth.users LIMIT 1)),
('emotions', 'Emotions and feelings', (SELECT id FROM auth.users LIMIT 1));

-- Create function to calculate consensus and update accuracy
CREATE OR REPLACE FUNCTION public.update_consensus_and_accuracy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_hash_val TEXT;
  similar_submissions INTEGER;
  total_submissions INTEGER;
  consensus_percentage NUMERIC(5,2);
BEGIN
  -- Generate hash for the English text to group similar submissions
  submission_hash_val := encode(digest(LOWER(TRIM(NEW.english_text)), 'sha256'), 'hex');
  NEW.submission_hash := submission_hash_val;
  
  -- Count similar submissions for this English text
  SELECT COUNT(*) INTO similar_submissions
  FROM public.training_submissions_log 
  WHERE submission_hash = submission_hash_val 
  AND tangkhul_text = NEW.tangkhul_text;
  
  -- Count total submissions for this English text
  SELECT COUNT(*) INTO total_submissions
  FROM public.training_submissions_log 
  WHERE submission_hash = submission_hash_val;
  
  -- Calculate consensus percentage
  IF total_submissions > 0 THEN
    consensus_percentage := (similar_submissions::NUMERIC / total_submissions::NUMERIC) * 100;
  ELSE
    consensus_percentage := 0;
  END IF;
  
  -- Update or insert consensus record
  INSERT INTO public.translation_consensus (english_text, tangkhul_text, submission_count, agreement_score)
  VALUES (NEW.english_text, NEW.tangkhul_text, similar_submissions + 1, consensus_percentage)
  ON CONFLICT (english_text, tangkhul_text) 
  DO UPDATE SET 
    submission_count = EXCLUDED.submission_count,
    agreement_score = EXCLUDED.agreement_score,
    updated_at = now();
  
  -- Mark as golden data if consensus is high (>= 80%) and multiple submissions
  IF consensus_percentage >= 80 AND total_submissions >= 3 THEN
    UPDATE public.translation_consensus 
    SET is_golden_data = true 
    WHERE english_text = NEW.english_text AND tangkhul_text = NEW.tangkhul_text;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for consensus calculation
CREATE TRIGGER update_consensus_trigger
  BEFORE INSERT ON public.training_submissions_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consensus_and_accuracy();

-- Create 10 mock high-accuracy contributors with perfect stats
DO $$
DECLARE
  mock_users UUID[] := ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  user_id UUID;
  i INTEGER;
BEGIN
  -- Create mock accuracy metrics for each user
  FOREACH user_id IN ARRAY mock_users LOOP
    INSERT INTO public.accuracy_metrics (
      contributor_id, 
      total_contributions, 
      validated_contributions, 
      accuracy_percentage, 
      golden_data_count
    ) VALUES (
      user_id,
      100, -- Each has 100 contributions
      100, -- All validated
      100.00, -- 100% accuracy
      50 -- 50 golden data entries each
    );
  END LOOP;
END $$;
