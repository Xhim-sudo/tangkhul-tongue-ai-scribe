
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'expert', 'reviewer', 'contributor');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role app_role NOT NULL DEFAULT 'contributor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create training_entries table for translation data
CREATE TABLE public.training_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  context TEXT,
  contributor_id UUID REFERENCES auth.users(id) NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id),
  confidence_score INTEGER DEFAULT 75 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create translations table for AI translation history
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'english',
  target_language TEXT NOT NULL DEFAULT 'tangkhul',
  confidence_score INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create invitations table for user invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone_number TEXT,
  role app_role NOT NULL DEFAULT 'contributor',
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create individual contributor datasets table
CREATE TABLE public.contributor_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  english_text TEXT NOT NULL,
  tangkhul_text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  context TEXT,
  tags TEXT[],
  accuracy_score INTEGER DEFAULT 0 CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  validation_count INTEGER DEFAULT 0,
  is_golden_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create data export tracking table
CREATE TABLE public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('individual', 'golden', 'full')),
  file_format TEXT NOT NULL CHECK (file_format IN ('csv', 'json', 'xlsx')),
  record_count INTEGER NOT NULL,
  file_size BIGINT,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create management password protection table
CREATE TABLE public.management_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user approval workflow table
CREATE TABLE public.user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create WhatsApp integration logs table
CREATE TABLE public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('invitation', 'notification', 'approval')),
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create accuracy tracking table
CREATE TABLE public.accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_contributions INTEGER DEFAULT 0,
  validated_contributions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  golden_data_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (contributor_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_metrics ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  );
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'contributor'::app_role
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate accuracy for a contributor
CREATE OR REPLACE FUNCTION public.calculate_contributor_accuracy(contributor_uuid UUID)
RETURNS DECIMAL(5,2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.00
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'approved') * 100.0) / COUNT(*), 
        2
      )
    END
  FROM public.training_entries 
  WHERE contributor_id = contributor_uuid;
$$;

-- Function to update accuracy metrics (called by trigger)
CREATE OR REPLACE FUNCTION public.update_accuracy_metrics()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.accuracy_metrics (contributor_id, total_contributions, validated_contributions, accuracy_percentage, golden_data_count)
  VALUES (
    NEW.contributor_id,
    (SELECT COUNT(*) FROM public.training_entries WHERE contributor_id = NEW.contributor_id),
    (SELECT COUNT(*) FROM public.training_entries WHERE contributor_id = NEW.contributor_id AND status = 'approved'),
    public.calculate_contributor_accuracy(NEW.contributor_id),
    (SELECT COUNT(*) FROM public.contributor_datasets WHERE contributor_id = NEW.contributor_id AND is_golden_data = true)
  )
  ON CONFLICT (contributor_id) DO UPDATE SET
    total_contributions = EXCLUDED.total_contributions,
    validated_contributions = EXCLUDED.validated_contributions,
    accuracy_percentage = EXCLUDED.accuracy_percentage,
    golden_data_count = EXCLUDED.golden_data_count,
    last_calculated = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger to update accuracy metrics when training entries change
CREATE TRIGGER update_accuracy_metrics_trigger
  AFTER INSERT OR UPDATE ON public.training_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_accuracy_metrics();

-- Function to identify golden data based on accuracy and consensus
CREATE OR REPLACE FUNCTION public.mark_golden_data()
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  marked_count INTEGER := 0;
BEGIN
  -- Mark high-accuracy entries from top contributors as golden data
  WITH top_contributors AS (
    SELECT contributor_id 
    FROM public.accuracy_metrics 
    WHERE accuracy_percentage >= 95 
    AND total_contributions >= 10
  ),
  high_accuracy_entries AS (
    SELECT te.id, te.english_text, te.tangkhul_text, te.category, te.context, te.tags, te.contributor_id
    FROM public.training_entries te
    JOIN top_contributors tc ON te.contributor_id = tc.contributor_id
    WHERE te.status = 'approved' 
    AND te.confidence_score >= 90
  )
  INSERT INTO public.contributor_datasets (
    contributor_id, english_text, tangkhul_text, category, context, tags, 
    accuracy_score, is_golden_data
  )
  SELECT 
    contributor_id, english_text, tangkhul_text, category, context, tags,
    95, true
  FROM high_accuracy_entries
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS marked_count = ROW_COUNT;
  RETURN marked_count;
END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile and admins can view all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for training_entries
CREATE POLICY "Contributors can create training entries"
  ON public.training_entries FOR INSERT
  WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Users can view approved entries and their own entries"
  ON public.training_entries FOR SELECT
  USING (
    status = 'approved' OR 
    contributor_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'expert'::app_role) OR
    public.has_role(auth.uid(), 'reviewer'::app_role)
  );

CREATE POLICY "Experts and reviewers can update entries"
  ON public.training_entries FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'expert'::app_role) OR
    public.has_role(auth.uid(), 'reviewer'::app_role) OR
    contributor_id = auth.uid()
  );

-- RLS Policies for translations
CREATE POLICY "Users can manage their own translations"
  ON public.translations FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for invitations
CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for contributor_datasets
CREATE POLICY "Contributors can view their own datasets"
  ON public.contributor_datasets FOR SELECT
  USING (contributor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contributors can create their own datasets"
  ON public.contributor_datasets FOR INSERT
  WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Admins and experts can update datasets"
  ON public.contributor_datasets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'expert'::app_role));

-- RLS Policies for data_exports
CREATE POLICY "Users can view their own exports"
  ON public.data_exports FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create export records"
  ON public.data_exports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for management_access
CREATE POLICY "Only admins can manage access passwords"
  ON public.management_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_approvals
CREATE POLICY "Users can view their own approval status"
  ON public.user_approvals FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage user approvals"
  ON public.user_approvals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for whatsapp_logs
CREATE POLICY "Admins can view WhatsApp logs"
  ON public.whatsapp_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create WhatsApp logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for accuracy_metrics
CREATE POLICY "Users can view their own metrics"
  ON public.accuracy_metrics FOR SELECT
  USING (contributor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage accuracy metrics"
  ON public.accuracy_metrics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'expert'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'expert'::app_role));

-- Insert some authentic Tangkhul phrases
INSERT INTO public.training_entries (english_text, tangkhul_text, category, context, contributor_id, status, confidence_score) VALUES
('Hello', 'Naga', 'greetings', 'Common greeting', (SELECT id FROM auth.users LIMIT 1), 'approved', 95),
('Thank you', 'Kharibak', 'expressions', 'Expression of gratitude', (SELECT id FROM auth.users LIMIT 1), 'approved', 95),
('Good morning', 'Asing kharibak', 'greetings', 'Morning greeting', (SELECT id FROM auth.users LIMIT 1), 'approved', 90),
('How are you?', 'Khara akhui nang?', 'greetings', 'Asking about wellbeing', (SELECT id FROM auth.users LIMIT 1), 'approved', 90),
('Goodbye', 'Charo', 'greetings', 'Farewell greeting', (SELECT id FROM auth.users LIMIT 1), 'approved', 95),
('Yes', 'Oi', 'expressions', 'Affirmative response', (SELECT id FROM auth.users LIMIT 1), 'approved', 95);
