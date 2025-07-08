
-- First, let's check and fix the user profile creation trigger
-- The trigger might not be working properly, so let's recreate it

-- Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone_number, staff_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'contributor'::app_role,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'staff_id'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now let's manually create/update the admin profile for jihalshimray1@gmail.com
-- First, let's find if this user exists in auth.users
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Try to find the user by email
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'jihalshimray1@gmail.com';
  
  IF user_uuid IS NOT NULL THEN
    -- User exists, create or update their profile
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      user_uuid,
      'jihalshimray1@gmail.com',
      'Jihal Shimray',
      'admin'::app_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin'::app_role,
      full_name = COALESCE(profiles.full_name, 'Jihal Shimray'),
      updated_at = NOW();
    
    RAISE NOTICE 'Profile created/updated for user: %', user_uuid;
  ELSE
    RAISE NOTICE 'User jihalshimray1@gmail.com not found in auth.users. They need to sign up first.';
  END IF;
END $$;

-- Let's also ensure all existing users have profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'contributor'::app_role,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
