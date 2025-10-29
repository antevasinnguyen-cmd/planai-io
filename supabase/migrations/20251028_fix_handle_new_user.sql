-- Fix handle_new_user trigger to avoid blocking auth user creation
-- Applies ON CONFLICT handling and guard against unexpected errors

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    plan_limit,
    chat_limit,
    word_limit,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'free',
    'active',
    1,
    5,
    1000,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET
      updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
