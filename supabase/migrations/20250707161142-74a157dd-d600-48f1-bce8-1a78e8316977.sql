
-- Add staff_id to invitations table
ALTER TABLE public.invitations ADD COLUMN staff_id TEXT UNIQUE;

-- Add staff_id to profiles table
ALTER TABLE public.profiles ADD COLUMN staff_id TEXT UNIQUE;

-- Create error_logs table for comprehensive error tracking
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name TEXT,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update management_access table for better password management
ALTER TABLE public.management_access ADD COLUMN password_label TEXT DEFAULT 'Default Management Password';
ALTER TABLE public.management_access ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create RLS policies for error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all error logs"
  ON public.error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to generate unique staff IDs
CREATE OR REPLACE FUNCTION public.generate_staff_id()
RETURNS TEXT
LANGUAGE PLPGSQL
AS $$
DECLARE
  new_id TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric ID
    new_id := upper(substr(md5(random()::text), 1, 6));
    
    -- Check if it already exists in profiles or invitations
    SELECT COUNT(*) INTO exists_check 
    FROM (
      SELECT staff_id FROM public.profiles WHERE staff_id = new_id
      UNION
      SELECT staff_id FROM public.invitations WHERE staff_id = new_id
    ) AS existing_ids;
    
    -- If unique, return the ID
    IF exists_check = 0 THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$;

-- Update invitation creation to auto-generate staff IDs if not provided
CREATE OR REPLACE FUNCTION public.ensure_staff_id_on_invitation()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  IF NEW.staff_id IS NULL THEN
    NEW.staff_id := public.generate_staff_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_staff_id_trigger
  BEFORE INSERT ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_staff_id_on_invitation();

-- Create indexes for performance
CREATE INDEX idx_profiles_staff_id ON public.profiles(staff_id);
CREATE INDEX idx_invitations_staff_id ON public.invitations(staff_id);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
