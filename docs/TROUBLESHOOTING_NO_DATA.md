# Troubleshooting: "Angler Not Found" and No Catches Showing

## Issue
After running the seed script successfully, the Vercel deployment shows:
- ❌ No catches in the feed
- ❌ "Angler not found" on profile pages

## Root Causes (Checklist)

### 1. Verify Data Exists in Database

**Go to Supabase Dashboard → SQL Editor** and run:

```sql
-- Quick verification
SELECT COUNT(*) FROM profiles;  -- Should return 3
SELECT COUNT(*) FROM catches WHERE deleted_at IS NULL;  -- Should return 11
SELECT COUNT(*) FROM sessions;  -- Should return 9
```

**If counts are 0:** The seed script didn't actually insert data. Re-run `supabase/seed-phase1-ready.sql`.

**If counts are correct:** Data exists, continue to step 2.

---

### 2. Test Queries Work in Database

Run the comprehensive diagnostic script:

**Copy `/tmp/diagnostic_queries.sql` contents** and paste into Supabase SQL Editor.

This will show:
- ✅ All profiles with usernames
- ✅ All catches with owners
- ✅ RLS policies
- ✅ If joins are working

**If queries return data:** Database is fine, continue to step 3.

**If queries return no data:** Database issue, re-run migration and seed.

---

### 3. Check Vercel Environment Variables

**CRITICAL:** Your Vercel deployment must have the correct Supabase credentials.

**Go to Vercel Dashboard:**
1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Verify these exist:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)

**Check the values match your Supabase project:**
- Go to Supabase Dashboard → Settings → API
- Compare:
  - **Project URL** matches `VITE_SUPABASE_URL`
  - **anon public** key matches `VITE_SUPABASE_PUBLISHABLE_KEY`

**If they don't match or are missing:**
1. Update the environment variables in Vercel
2. Redeploy your app (Vercel → Deployments → Redeploy)

---

### 4. Test Queries in Browser Console

**Open your Vercel deployment** → Open Browser DevTools (F12) → Console tab

**Run these commands:**

```javascript
// Test 1: Check Supabase is connected
window.supabase
// Should show: { auth: {...}, from: [Function], ... }

// Test 2: Query profiles
const { data: profiles, error: profileError } = await window.supabase
  .from('profiles')
  .select('*')
console.log('Profiles:', profiles, 'Error:', profileError)
// Should show array of 3 profiles

// Test 3: Query catches
const { data: catches, error: catchError } = await window.supabase
  .from('catches')
  .select('*, profiles:user_id (username)')
  .is('deleted_at', null)
console.log('Catches:', catches, 'Error:', catchError)
// Should show array of 11 catches

// Test 4: Check authentication
const { data: { user } } = await window.supabase.auth.getUser()
console.log('User:', user)
// Should show user object if signed in, null if not
```

**Interpret results:**

| Result | Meaning | Fix |
|--------|---------|-----|
| `window.supabase` is undefined | Frontend not loading Supabase client | Check Vercel build logs |
| Profiles query returns empty array | No data OR wrong database | Check environment variables (step 3) |
| Profiles query returns error | RLS blocking OR wrong credentials | Check error message |
| Catches query returns empty array | Same as profiles | Same as profiles |
| User is null | Not signed in | Sign in to app |

---

### 5. Check for Console Errors

**In Browser DevTools → Console tab**, look for errors:

**Common errors and fixes:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `404: relation "ratings" does not exist` | Migration not applied | Re-run migration in Supabase |
| `permission denied for table catches` | RLS blocking query | Check RLS policies (step 2) |
| `Failed to load catches` | Frontend error | Check Network tab for API errors |
| `VITE_SUPABASE_URL is undefined` | Missing env vars | Add to Vercel (step 3) |

---

### 6. Verify You're Signed In

**The Feed page requires authentication!**

1. Go to your Vercel deployment
2. Click **Sign In** (top right)
3. Use: `mike@test.com` / `TestPass123!`
4. Navigate to **Feed** page

**If you can't sign in:**
- Check auth.users exist: `SELECT email FROM auth.users;` in Supabase SQL Editor
- Verify emails: mike@test.com, sarah@test.com, tom@test.com
- If missing, create accounts via your app's signup page first

---

### 7. Check Specific Profile URL

**Profile page expects:**
- `/profile/mike` (username)
- `/profile/1cb53e69-66d7-4a0a-9727-fb95bec01575` (UUID)

**Test in browser:**
1. Go to `https://your-app.vercel.app/profile/mike`
2. Should show Mike's profile

**If still "Angler not found":**
- Verify username exists: `SELECT username FROM profiles;` in SQL Editor
- Check browser console for errors
- Check Network tab for API errors

---

## Quick Fix Checklist

- [ ] Database has data (run counts query)
- [ ] Vercel env vars are correct and match Supabase project
- [ ] Redeployed Vercel after updating env vars
- [ ] Signed in to app with mike@test.com
- [ ] Browser console shows no errors
- [ ] window.supabase queries return data
- [ ] Network tab shows successful API calls

---

## Still Not Working?

**Run this full diagnostic and share the output:**

```sql
-- Run in Supabase SQL Editor
SELECT 'Profiles:' as check_name, COUNT(*)::text as result FROM profiles
UNION ALL
SELECT 'Catches:', COUNT(*)::text FROM catches WHERE deleted_at IS NULL
UNION ALL
SELECT 'Sessions:', COUNT(*)::text FROM sessions
UNION ALL
SELECT 'Mike exists:', CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE username = 'mike') THEN 'YES' ELSE 'NO' END
UNION ALL
SELECT 'Catches visible:', CASE WHEN EXISTS(SELECT 1 FROM catches WHERE deleted_at IS NULL) THEN 'YES' ELSE 'NO' END;
```

**And run this in Browser Console:**

```javascript
const { data: profiles } = await window.supabase.from('profiles').select('*')
const { data: catches } = await window.supabase.from('catches').select('*').is('deleted_at', null)
const { data: { user } } = await window.supabase.auth.getUser()
console.log({
  profileCount: profiles?.length ?? 0,
  catchCount: catches?.length ?? 0,
  isSignedIn: !!user,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL
})
```

Share both outputs and we'll diagnose further.
