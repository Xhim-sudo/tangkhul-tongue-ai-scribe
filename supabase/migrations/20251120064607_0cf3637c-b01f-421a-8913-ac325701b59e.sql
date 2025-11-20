-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text matching

-- Create custom types/enums
CREATE TYPE app_role AS ENUM ('admin', 'expert', 'reviewer', 'contributor');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================
-- PROFILES TABLE (User Management)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  staff_id TEXT UNIQUE,
  role app_role NOT NULL DEFAULT 'contributor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- TRAINING CATEGORIES
-- ============================================
CREATE TABLE public.training_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.training_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.training_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON public.training_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TRAINING ENTRIES (Base Translation Data)
-- ============================================
CREATE TABLE public.training_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  category_id UUID REFERENCES public.training_categories(id),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id),
  is_golden_data BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(5,4) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_entries_english ON public.training_entries USING gin(english_text gin_trgm_ops);
CREATE INDEX idx_training_entries_tangkhul ON public.training_entries USING gin(tangkhul_text gin_trgm_ops);
CREATE INDEX idx_training_entries_contributor ON public.training_entries(contributor_id);
CREATE INDEX idx_training_entries_category ON public.training_entries(category_id);

ALTER TABLE public.training_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view training entries"
  ON public.training_entries FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create entries"
  ON public.training_entries FOR INSERT
  WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Users can update own entries"
  ON public.training_entries FOR UPDATE
  USING (auth.uid() = contributor_id);

CREATE POLICY "Admins can update any entry"
  ON public.training_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TRAINING SUBMISSIONS LOG
-- ============================================
CREATE TABLE public.training_submissions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  category_id UUID REFERENCES public.training_categories(id),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id),
  is_golden_data BOOLEAN DEFAULT FALSE,
  grammar_features JSONB,
  linguistic_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_contributor ON public.training_submissions_log(contributor_id);
CREATE INDEX idx_submissions_created ON public.training_submissions_log(created_at DESC);

ALTER TABLE public.training_submissions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON public.training_submissions_log FOR SELECT
  USING (auth.uid() = contributor_id);

CREATE POLICY "Reviewers can view all submissions"
  ON public.training_submissions_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'expert', 'reviewer')
    )
  );

CREATE POLICY "Users can create submissions"
  ON public.training_submissions_log FOR INSERT
  WITH CHECK (auth.uid() = contributor_id);

-- ============================================
-- TRANSLATION CONSENSUS
-- ============================================
CREATE TABLE public.translation_consensus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  agreement_score DECIMAL(5,4) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_promoted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consensus_english ON public.translation_consensus(english_text);
CREATE INDEX idx_consensus_tangkhul ON public.translation_consensus(tangkhul_text);
CREATE INDEX idx_consensus_promoted ON public.translation_consensus(is_promoted) WHERE is_promoted = true;

ALTER TABLE public.translation_consensus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view consensus"
  ON public.translation_consensus FOR SELECT
  USING (true);

CREATE POLICY "Only reviewers can manage consensus"
  ON public.translation_consensus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'expert', 'reviewer')
    )
  );

-- ============================================
-- CONTRIBUTOR DATASETS (Accuracy Tracking)
-- ============================================
CREATE TABLE public.contributor_datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id),
  total_submissions INTEGER DEFAULT 0,
  approved_submissions INTEGER DEFAULT 0,
  rejected_submissions INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,4) DEFAULT 0,
  last_submission_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contributor_id)
);

CREATE INDEX idx_contributor_datasets_user ON public.contributor_datasets(contributor_id);

ALTER TABLE public.contributor_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dataset"
  ON public.contributor_datasets FOR SELECT
  USING (auth.uid() = contributor_id);

CREATE POLICY "Reviewers can view all datasets"
  ON public.contributor_datasets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'expert', 'reviewer')
    )
  );

CREATE POLICY "System can manage datasets"
  ON public.contributor_datasets FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ACCURACY METRICS
-- ============================================
CREATE TABLE public.accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id),
  entry_id UUID REFERENCES public.training_entries(id),
  metric_type TEXT NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accuracy_contributor ON public.accuracy_metrics(contributor_id);
CREATE INDEX idx_accuracy_entry ON public.accuracy_metrics(entry_id);
CREATE INDEX idx_accuracy_created ON public.accuracy_metrics(created_at DESC);

ALTER TABLE public.accuracy_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON public.accuracy_metrics FOR SELECT
  USING (auth.uid() = contributor_id);

CREATE POLICY "Reviewers can view all metrics"
  ON public.accuracy_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'expert', 'reviewer')
    )
  );

CREATE POLICY "System can create metrics"
  ON public.accuracy_metrics FOR INSERT
  WITH CHECK (true);

-- ============================================
-- USER APPROVALS
-- ============================================
CREATE TABLE public.user_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_user ON public.user_approvals(user_id);
CREATE INDEX idx_approvals_status ON public.user_approvals(status);

ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals"
  ON public.user_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage approvals"
  ON public.user_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ERROR LOGS
-- ============================================
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user ON public.error_logs(user_id);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all error logs"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- DATA EXPORTS
-- ============================================
CREATE TABLE public.data_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  export_type TEXT NOT NULL,
  status export_status NOT NULL DEFAULT 'pending',
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_exports_user ON public.data_exports(user_id);
CREATE INDEX idx_exports_status ON public.data_exports(status);

ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON public.data_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports"
  ON public.data_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRANSLATION CACHE
-- ============================================
CREATE TABLE public.translation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  confidence_score DECIMAL(5,4),
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_text, source_lang, target_lang)
);

CREATE INDEX idx_cache_lookup ON public.translation_cache(source_text, source_lang, target_lang);
CREATE INDEX idx_cache_last_used ON public.translation_cache(last_used_at DESC);

ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
  ON public.translation_cache FOR SELECT
  USING (true);

CREATE POLICY "System can manage cache"
  ON public.translation_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TRANSLATION ANALYTICS
-- ============================================
CREATE TABLE public.translation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  query_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  result_found BOOLEAN NOT NULL,
  confidence_score DECIMAL(5,4),
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON public.translation_analytics(user_id);
CREATE INDEX idx_analytics_created ON public.translation_analytics(created_at DESC);

ALTER TABLE public.translation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON public.translation_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
  ON public.translation_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert analytics"
  ON public.translation_analytics FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_entries_updated_at
  BEFORE UPDATE ON public.training_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consensus_updated_at
  BEFORE UPDATE ON public.translation_consensus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributor_datasets_updated_at
  BEFORE UPDATE ON public.contributor_datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, staff_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'staff_id',
    'contributor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate staff ID
CREATE OR REPLACE FUNCTION public.generate_staff_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_id := 'STAFF-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE staff_id = new_id) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to mark data as golden
CREATE OR REPLACE FUNCTION public.mark_golden_data(entry_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.training_entries
  SET is_golden_data = TRUE, updated_at = NOW()
  WHERE id = entry_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(check_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate similarity between texts
CREATE OR REPLACE FUNCTION public.calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN similarity(text1, text2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;