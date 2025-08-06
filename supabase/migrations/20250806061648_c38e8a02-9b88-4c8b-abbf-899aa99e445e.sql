-- Enhanced database schema for grammatical categories and production features
-- Add grammatical metadata columns to training_entries
ALTER TABLE public.training_entries 
ADD COLUMN part_of_speech TEXT DEFAULT 'unknown',
ADD COLUMN grammatical_features JSONB DEFAULT '{}',
ADD COLUMN difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
ADD COLUMN usage_frequency TEXT DEFAULT 'common' CHECK (usage_frequency IN ('very_common', 'common', 'uncommon', 'rare')),
ADD COLUMN is_phrase BOOLEAN DEFAULT false,
ADD COLUMN word_count INTEGER DEFAULT 1;

-- Add indexes for better performance
CREATE INDEX idx_training_entries_part_of_speech ON public.training_entries(part_of_speech);
CREATE INDEX idx_training_entries_difficulty ON public.training_entries(difficulty_level);
CREATE INDEX idx_training_entries_frequency ON public.training_entries(usage_frequency);
CREATE INDEX idx_training_entries_phrase ON public.training_entries(is_phrase);
CREATE INDEX idx_training_entries_status_approved ON public.training_entries(status) WHERE status = 'approved';

-- Full text search indexes for better matching
CREATE INDEX idx_training_entries_english_fts ON public.training_entries USING gin(to_tsvector('english', english_text));
CREATE INDEX idx_training_entries_tangkhul_fts ON public.training_entries USING gin(to_tsvector('simple', tangkhul_text));

-- Update word_count based on existing data
UPDATE public.training_entries 
SET word_count = array_length(string_to_array(trim(english_text), ' '), 1)
WHERE word_count = 1;

-- Set is_phrase based on word count
UPDATE public.training_entries 
SET is_phrase = (word_count > 1);

-- Create a function to calculate text similarity
CREATE OR REPLACE FUNCTION public.calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Simple word overlap similarity calculation
  RETURN (
    SELECT CASE 
      WHEN array_length(words1, 1) = 0 OR array_length(words2, 1) = 0 THEN 0.0
      ELSE (
        SELECT COUNT(*)::FLOAT / GREATEST(array_length(words1, 1), array_length(words2, 1))
        FROM (
          SELECT unnest(words1) as word
          INTERSECT
          SELECT unnest(words2) as word
        ) common_words
      )
    END
    FROM (
      SELECT 
        string_to_array(lower(regexp_replace(text1, '[^a-zA-Z\s]', '', 'g')), ' ') as words1,
        string_to_array(lower(regexp_replace(text2, '[^a-zA-Z\s]', '', 'g')), ' ') as words2
    ) word_arrays
  );
END;
$$;

-- Insert some essential vocabulary for testing and production
INSERT INTO public.training_entries (english_text, tangkhul_text, category, part_of_speech, difficulty_level, usage_frequency, is_phrase, word_count, status, confidence_score, contributor_id)
VALUES 
-- Basic nouns
('water', 'ishi', 'nouns', 'noun', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('house', 'khun', 'nouns', 'noun', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('food', 'chak', 'nouns', 'noun', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('mother', 'ana', 'family', 'noun', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('father', 'apa', 'family', 'noun', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('child', 'nao', 'family', 'noun', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Basic verbs
('go', 'katho', 'verbs', 'verb', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('come', 'hung', 'verbs', 'verb', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('eat', 'ne', 'verbs', 'verb', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('sleep', 'ip', 'verbs', 'verb', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('see', 'mu', 'verbs', 'verb', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Basic adjectives
('good', 'pha', 'adjectives', 'adjective', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('bad', 'phang', 'adjectives', 'adjective', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('big', 'kawon', 'adjectives', 'adjective', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('small', 'tei', 'adjectives', 'adjective', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Common phrases
('How are you?', 'Nang kasom nungaibo?', 'greetings', 'phrase', 'basic', 'very_common', true, 3, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Good morning', 'Nungshing asha pha', 'greetings', 'phrase', 'basic', 'very_common', true, 2, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Thank you', 'Thabang nang', 'greetings', 'phrase', 'basic', 'very_common', true, 2, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('What is your name?', 'Nang ming kari nungai?', 'introductions', 'phrase', 'basic', 'very_common', true, 5, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Where are you going?', 'Nang kadi katho nungai?', 'questions', 'phrase', 'intermediate', 'common', true, 5, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Numbers
('one', 'khat', 'numbers', 'numeral', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('two', 'kni', 'numbers', 'numeral', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('three', 'tham', 'numbers', 'numeral', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('four', 'mari', 'numbers', 'numeral', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('five', 'manga', 'numbers', 'numeral', 'basic', 'very_common', false, 1, 'approved', 95, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))

ON CONFLICT DO NOTHING;