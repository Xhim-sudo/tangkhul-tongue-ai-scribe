-- Create demo test accounts for smoke testing
-- Note: Passwords will be set via Supabase Auth UI

-- Insert demo profiles (user IDs will be generated when they sign up via auth)
-- For now, we'll create placeholder entries that will be updated on first login

-- Create a function to easily create test accounts
CREATE OR REPLACE FUNCTION create_demo_profile(
  p_email TEXT,
  p_full_name TEXT,
  p_role app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Generate a deterministic UUID based on email for demo purposes
  v_user_id := gen_random_uuid();
  
  -- Insert into profiles (will be updated when user actually signs up)
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (v_user_id, p_email, p_full_name, p_role)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  
  RETURN v_user_id;
END;
$$;

-- Note: Actual user creation must be done through Supabase Auth
-- These are just placeholder profiles
-- Users need to sign up via the app with these credentials:
-- demo_contributor@test.com / Demo123!
-- demo_reviewer@test.com / Demo123!