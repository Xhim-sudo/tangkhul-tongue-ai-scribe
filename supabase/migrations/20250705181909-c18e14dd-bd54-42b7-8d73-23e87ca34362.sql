
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'expert', 'reviewer', 'contributor');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
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
  role app_role NOT NULL DEFAULT 'contributor',
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

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

-- Insert some authentic Tangkhul phrases
INSERT INTO public.training_entries (english_text, tangkhul_text, category, context, contributor_id, status, confidence_score) VALUES
('Hello', 'Naga', 'greetings', 'Common greeting', (SELECT id FROM auth.users LIMIT 1), 'approved', 95),
('Thank you', 'Kharibak', 'expressions', 'Expression of gratitude', (SELECT id FROM auth.users LIMIT 1), 'approved', 95),
('Good morning', 'Asing kharibak', 'greetings', 'Morning greeting', (SELECT id FROM auth.users LIMIT 1), 'approved', 90),
('How are you?', 'Khara akhui nang?', 'greetings', 'Asking about wellbeing', (SELECT id FROM auth.users LIMIT 1), 'approved', 90),
('Goodbye', 'Charo', 'greetings', 'Farewell greeting', (SELECT id FROM auth.users LIMIT 1), 'approved', 95),
('Yes', 'Oi', 'expressions', 'Affirmative response', (SELECT id FROM auth.users LIMIT 1), 'approved', 95);
