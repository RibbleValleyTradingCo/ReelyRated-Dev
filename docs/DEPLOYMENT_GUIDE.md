# Phase 1 Deployment Guide

## Critical Issue Identified

Your production database **does not have the Phase 1 migration applied**. Your frontend is getting errors because:

1. ❌ Phase 1 tables don't exist (`profiles`, `catches`, `sessions` are missing or misconfigured)
2. ❌ RLS policies are not set up (getting "permission denied for schema public")
3. ✅ Frontend has been fixed to not query Phase 2+ tables

---

## Steps to Fix

### Step 1: Apply Phase 1 Migration to Production Database

**Go to your Supabase Dashboard**:
1. Open https://supabase.com/dashboard
2. Select your project: `omsvmiufwvdeslcyrmkt`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

**Copy and paste the ENTIRE file**:
- Open `supabase/migrations/20251114000000_phase1_core_rebuild.sql`
- Copy ALL contents (it's a long file, ~600+ lines)
- Paste into SQL Editor
- Click **Run**

**⚠️ WARNING**: This will DROP and recreate these tables:
- `profiles`
- `sessions`
- `catches`
- `water_types`
- `baits`
- `tags`

Any existing data in these tables will be deleted. This is fine for dev/test.

**Expected output**:
- Should see "Success. No rows returned" (this is normal)
- Check for any ERROR messages (there shouldn't be any)

---

### Step 2: Verify Tables Were Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see**:
- `baits`
- `catches`
- `profiles`
- `sessions`
- `tags`
- `water_types`

**You should NOT see** (these are Phase 2+):
- ~~`notifications`~~
- ~~`profile_follows`~~
- ~~`ratings`~~
- ~~`catch_comments`~~
- ~~`admin_users`~~

---

### Step 3: Seed Test Data

Run this in SQL Editor:

**Option A: Using your existing users** (mike@test.com, sarah@test.com, tom@test.com):
- Copy entire contents of `supabase/seed-phase1-ready.sql`
- Paste and run

**Option B: Using any users you have**:
- Copy entire contents of `supabase/seed-phase1-simple.sql`
- Paste and run
- This will work with any users you've created

**Expected output**:
```
NOTICE: SEED DATA COMPLETE!
NOTICE: Profiles: 3
NOTICE: Sessions: 9
NOTICE: Catches: 11
```

---

### Step 4: Verify Data

```sql
-- Check profiles
SELECT id, username, display_name FROM profiles;

-- Check catches
SELECT
    c.title,
    c.species,
    p.username
FROM catches c
JOIN profiles p ON c.user_id = p.id
WHERE c.deleted_at IS NULL;
```

**You should see**:
- 3 profiles (mike, sarah, tom)
- 11 catches with various species

---

### Step 5: Deploy Frontend Changes

**Pull latest changes**:
```bash
git pull origin claude/rebuild-reelyrrated-db-phase1-01BWUjLEuarFKe3UpbnBEEkK
```

**Redeploy** to Vercel:
- Your app should auto-deploy from the branch
- OR manually trigger a redeploy in Vercel dashboard

**Wait for deployment** to complete.

---

### Step 6: Test Your App

1. **Open your app**: https://reely-rated-codex-git-claude-reb-5cc22f-james-projects-e01de6b7.vercel.app
2. **Sign in** as mike@test.com (password: TestPass123!)
3. **Check the Feed page**:
   - Should see 11 catches
   - No 404 errors in console
   - No permission denied errors

**Expected console output**:
- ✅ No 404 errors
- ✅ No "permission denied" errors
- ✅ Catches should load and display

---

## Frontend Changes Made

I've updated your frontend to work with Phase 1 only:

### ✅ Fixed Files:
1. **`src/pages/Feed.tsx`**:
   - Removed queries for `ratings`, `catch_comments`, `catch_reactions`
   - Removed `profile_follows` query
   - Added soft delete filter (`.is('deleted_at', null)`)
   - Added placeholder empty arrays for Phase 2 features

2. **`src/lib/notifications.ts`**:
   - Disabled notifications queries (table doesn't exist in Phase 1)
   - Returns empty array instead of querying DB

### 🎯 Result:
- App will work with **Phase 1 schema only**
- No errors from missing Phase 2 tables
- Ready for Phase 2 upgrade later

---

## Troubleshooting

### Still seeing "permission denied"?

**Check RLS is enabled**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

**Check policies exist**:
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Should see policies like:
- `Profiles are viewable by everyone`
- `Users can view own catches`
- `Public catches are viewable by everyone`

### Still no catches showing?

**Check if catches exist**:
```sql
SELECT COUNT(*) FROM catches WHERE deleted_at IS NULL;
```

Should return `11`.

**Check RLS as your user**:
```sql
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "1cb53e69-66d7-4a0a-9727-fb95bec01575"}';

SELECT * FROM catches WHERE deleted_at IS NULL LIMIT 5;
```

Should see catches.

### Admin_users errors still appearing?

These are expected and harmless. The `admin_users` table is Phase 4 (moderation). Your app gracefully handles it not existing.

---

## Phase 1 Features Now Available

Once deployed, users can:
- ✅ Sign up and create profiles
- ✅ Edit their profile (bio, location, avatar)
- ✅ Create fishing sessions
- ✅ Log catches with photos, species, weight, conditions
- ✅ View public catch feed
- ✅ Set privacy levels (public/private)
- ✅ Soft delete catches and sessions

### Not Yet Available (Phase 2+):
- ❌ Like/react to catches (Phase 2)
- ❌ Comment on catches (Phase 2)
- ❌ Follow other anglers (Phase 2)
- ❌ Rate catches (Phase 2)
- ❌ Notifications (Phase 4)
- ❌ Moderation tools (Phase 4)

---

## Success Checklist

- [ ] Phase 1 migration applied (6 tables created)
- [ ] Test data seeded (3 profiles, 9 sessions, 11 catches)
- [ ] Verified data in database
- [ ] Frontend deployed with Phase 1 fixes
- [ ] Can sign in to app
- [ ] Feed page loads without errors
- [ ] Can see catches in feed
- [ ] No 404 errors in console
- [ ] No permission denied errors

---

## Next Steps

Once Phase 1 is working:
1. ✅ Test all Phase 1 features
2. ✅ Create some real catches
3. ✅ Verify soft deletes work
4. ⏭️ Ready to discuss Phase 2 (social features)

Need help? Check the errors in Supabase Logs or browser console and let me know!
