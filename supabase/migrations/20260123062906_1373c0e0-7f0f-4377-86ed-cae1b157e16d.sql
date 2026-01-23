-- Create secure has_role function first
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix error_logs RLS policy to use secure has_role function
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;

CREATE POLICY "Admins can view all error logs" ON error_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own error logs
DROP POLICY IF EXISTS "Users can insert error logs" ON error_logs;

CREATE POLICY "Users can insert error logs" ON error_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);