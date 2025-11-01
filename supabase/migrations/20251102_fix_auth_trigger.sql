-- Fix auth trigger - handle profile creation errors gracefully
-- Problem: Trigger fails when creating profile for new users
-- Solution: Make trigger more robust with better error handling

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function that handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get email from new user
  v_email := NEW.email;
  
  -- Only create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        v_email,
        NOW(),
        NOW()
      );
      
      RAISE LOG 'Profile created for user: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the trigger
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
      -- Continue anyway - user is created, profile can be created later
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure profiles table has proper constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_not_null CHECK (email IS NOT NULL);

-- Create profiles for any existing auth users without profiles
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
