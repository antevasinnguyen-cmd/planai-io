-- Fix auth trigger RLS issue
-- The trigger needs SECURITY DEFINER to bypass RLS when inserting profile

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with SECURITY DEFINER (allows bypass RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also fix RLS policy to allow service role to insert
-- Drop old policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policy that allows:
-- 1. Users to insert their own profile (auth.uid() = id)
-- 2. Service role to insert (for migrations/admin)
CREATE POLICY "Allow insert own profile or service role" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Also ensure SELECT and UPDATE work for service role
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Allow select own profile or service role" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Allow update own profile or service role" ON profiles
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );
