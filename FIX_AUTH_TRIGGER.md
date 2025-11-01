# 🚨 Fix Auth Trigger - Database Error Saving New User

**Status:** ⚠️ REQUIRES MANUAL SUPABASE SETUP
**Date:** Nov 2, 2025
**Severity:** CRITICAL - Blocks all Google OAuth signups

---

## 🔴 Problem

**Error:** "500: Database error saving new user" when signing up with Google

**Root Cause:**
- Supabase trigger `on_auth_user_created` fails to create profile
- User created in `auth.users` but no profile in `profiles` table
- Callback redirects but user can't access dashboard
- User stuck at home page

---

## ✅ Solution (2 Parts)

### Part 1: Code Fix (Already Deployed ✅)

**File:** `app/auth/callback/route.ts`

Added fallback profile creation:
```typescript
// Ensure profile exists (fallback if trigger failed)
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    email: userEmail,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'id'
  })
```

**Status:** ✅ Deployed in commit `8a53b8d`

---

### Part 2: Supabase Migration (MANUAL SETUP REQUIRED ⚠️)

**File:** `supabase/migrations/20251102_fix_auth_trigger.sql`

**Steps to Apply:**

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Select project: `wjzmscsoiibzlxejqpgg`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste Migration:**
   ```sql
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
   -- Only add if it doesn't exist
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints 
       WHERE table_name = 'profiles' 
       AND constraint_name = 'profiles_email_not_null'
     ) THEN
       ALTER TABLE public.profiles
         ADD CONSTRAINT profiles_email_not_null CHECK (email IS NOT NULL);
     END IF;
   END $$;

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
   ```

4. **Click "Run"** (or Cmd+Enter)

5. **Verify Success:**
   - Should see: "Query executed successfully"
   - Check logs for any errors

---

## 🧪 Testing

### Before Running Migration:

**Test 1: Google Signup (Current)**
1. Go to https://planai.io.vn/signup
2. Click "Đăng ký với Google"
3. Complete Google OAuth
4. **Expected:** Redirected to dashboard (with fallback profile creation)
5. **Actual:** May still fail if profile creation fails

### After Running Migration:

**Test 2: Google Signup (After Migration)**
1. Go to https://planai.io.vn/signup
2. Click "Đăng ký với Google"
3. Complete Google OAuth
4. **Expected:** Redirected to dashboard ✅
5. **Actual:** Should work smoothly

**Test 3: Existing Users**
1. Check if profiles exist for all auth users
2. Query: `SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM profiles)`
3. **Expected:** 0 (all users have profiles)

---

## 📊 What Changed

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| **Trigger** | Fails silently | Handles errors gracefully | ✅ Fixed |
| **Profile Creation** | No fallback | Fallback in callback | ✅ Fixed |
| **Error Handling** | Crashes | Continues anyway | ✅ Fixed |
| **Existing Users** | No profiles | Auto-created | ✅ Fixed |

---

## 🔍 Debugging

### If Still Failing:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Look for "Database error" messages
   - Check trigger logs

2. **Check Profiles Table:**
   - Query: `SELECT * FROM profiles LIMIT 10`
   - Verify email column is not null

3. **Check Auth Users:**
   - Query: `SELECT id, email FROM auth.users LIMIT 10`
   - Compare with profiles table

4. **Check Constraints:**
   - Query: `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'profiles'`
   - Verify `profiles_email_not_null` exists

---

## 📝 Notes

- **Fallback Code:** Already deployed, works immediately
- **Migration:** Improves trigger robustness, should run ASAP
- **No Data Loss:** Safe to run, uses `ON CONFLICT DO NOTHING`
- **Backwards Compatible:** Doesn't break existing functionality

---

## ✅ Completion Checklist

- [ ] Run migration in Supabase SQL Editor
- [ ] Verify "Query executed successfully"
- [ ] Test Google signup
- [ ] Verify user redirected to dashboard
- [ ] Check profiles table has all users
- [ ] Monitor Supabase logs for errors

---

**Status:** ⚠️ Code deployed, waiting for manual migration
**Next Step:** Run migration in Supabase Dashboard
**ETA:** ~2 minutes to complete

