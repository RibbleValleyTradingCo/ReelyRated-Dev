# Complete Schema Deployment Guide

## What This Is

This is **ONE complete migration** that includes **ALL features** your frontend uses:
- ✅ Core tables (profiles, sessions, catches)
- ✅ Social features (comments, reactions, ratings, follows)
- ✅ Moderation (reports, warnings, admin users)
- ✅ Notifications
- ✅ All lookup tables
- ✅ Leaderboard view
- ✅ All RPC functions

**No phasing. Everything at once.**

---

## ⚠️ IMPORTANT WARNING

This migration uses **`DROP TABLE ... CASCADE`** which will **DELETE ALL DATA** in these tables:
- profiles
- sessions
- catches
- All social data (comments, reactions, ratings, follows)
- All notifications
- All reports
- Everything

**This is SAFE for:**
- ✅ Development environments
- ✅ Test databases
- ✅ When you have no real user data

**This is NOT SAFE for:**
- ❌ Production with real users
- ❌ Any database where you want to preserve data

---

## Step-by-Step Deployment

### Step 1: Apply the Complete Migration

**Go to Supabase Dashboard** → SQL Editor:

1. Open `supabase/migrations/20251115000000_complete_schema_rebuild.sql`
2. Copy **ALL** contents (it's ~1000 lines)
3. Paste into SQL Editor
4. Click **Run**

**Expected output:**
```
NOTICE: ========================================
NOTICE: COMPLETE SCHEMA REBUILD SUCCESSFUL!
NOTICE: ========================================
NOTICE: Tables created:
NOTICE:   Core: profiles, sessions, catches
NOTICE:   Social: catch_comments, catch_reactions, ratings, profile_follows
NOTICE:   Moderation: reports, admin_users, user_warnings, moderation_log
NOTICE:   Notifications: notifications
NOTICE:   Lookups: water_types, baits, tags
NOTICE:
NOTICE: Views created: leaderboard_scores_detailed
NOTICE:
NOTICE: Functions created:
NOTICE:   - create_notification
NOTICE:   - admin_delete_catch
NOTICE:   - admin_delete_comment
NOTICE:   - admin_restore_catch
NOTICE:   - admin_restore_comment
NOTICE:   - admin_warn_user
NOTICE: ========================================
```

---

### Step 2: Verify Tables Were Created

Run this in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'profiles', 'sessions', 'catches',
    'catch_comments', 'catch_reactions', 'ratings', 'profile_follows',
    'notifications', 'reports', 'admin_users', 'user_warnings', 'moderation_log',
    'water_types', 'baits', 'tags'
)
ORDER BY table_name;
```

**You should see all 15 tables.**

---

### Step 3: Seed Test Data

Run `supabase/seed-phase1-ready.sql` (which uses your actual user IDs):

```sql
-- This file has mike, sarah, tom's real UUIDs hardcoded
-- Copy and paste the entire file and run it
```

This creates:
- 3 profiles with bios and locations
- 9 sessions
- 11 catches with realistic data

---

### Step 4: Deploy Frontend

Your frontend is already updated! Just redeploy:

```bash
# It should auto-deploy from your branch
# Or manually trigger redeploy in Vercel dashboard
```

---

### Step 5: Test Your App

1. Sign in as `mike@test.com` / `TestPass123!`
2. Go to Feed page
3. **Should see:** 11 catches with ratings/comments
4. **Should NOT see:** Any 404 errors in console

---

## What's Now Available

### Core Features ✅
- User profiles with moderation fields
- Create fishing sessions
- Log catches with all fields
- Soft delete catches and sessions

### Social Features ✅
- React/like catches
- Comment on catches
- Follow other anglers
- Rate catches (1-10)

### Moderation Features ✅
- Report catches/comments/profiles
- Admin can delete/restore catches
- Admin can warn/suspend/ban users
- Moderation audit log

### Notifications ✅
- Get notified of follows, comments, reactions, ratings
- Admin notifications for reports
- Mark as read/unread

### Analytics ✅
- Leaderboard view with scores
- Insights by species, venue, method

---

## Frontend Features Now Working

**Previously broken (404 errors):**
- ✅ Feed queries now work (ratings, comments, reactions)
- ✅ Profile follows work
- ✅ Notifications bell works
- ✅ Admin reports page works

**New features enabled:**
- ✅ Like/react to catches
- ✅ Comment on catches
- ✅ Follow anglers
- ✅ Rate catches
- ✅ View leaderboard

---

## Verify Everything Works

### Test Core Features
```sql
-- Check profiles
SELECT id, username, display_name FROM profiles;

-- Check catches
SELECT title, species, weight FROM catches WHERE deleted_at IS NULL;

-- Check sessions
SELECT title, venue FROM sessions;
```

### Test Social Features
```sql
-- Check comments (should be 0 initially)
SELECT COUNT(*) FROM catch_comments WHERE deleted_at IS NULL;

-- Check ratings (should be 0 initially)
SELECT COUNT(*) FROM ratings;

-- Check reactions (should be 0 initially)
SELECT COUNT(*) FROM catch_reactions;

-- Check follows (should be 0 initially)
SELECT COUNT(*) FROM profile_follows;
```

### Test Moderation
```sql
-- Check admin users (should be 0 initially)
SELECT COUNT(*) FROM admin_users;

-- To make yourself an admin:
INSERT INTO admin_users (user_id)
VALUES ('your-user-id-here');
```

### Test Leaderboard View
```sql
SELECT
    owner_username,
    title,
    total_score,
    avg_rating,
    rating_count
FROM leaderboard_scores_detailed
ORDER BY total_score DESC
LIMIT 10;
```

---

## Troubleshooting

### Still getting 404 errors?

Check that frontend deployed:
- Pull latest code: `git pull origin your-branch`
- Redeploy to Vercel

### Tables not created?

Run this to see what's missing:
```sql
SELECT
    unnest(ARRAY[
        'profiles', 'sessions', 'catches',
        'catch_comments', 'catch_reactions', 'ratings', 'profile_follows',
        'notifications', 'reports', 'admin_users', 'user_warnings', 'moderation_log',
        'water_types', 'baits', 'tags'
    ]) AS expected_table
EXCEPT
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

If any tables are missing, the migration didn't complete. Check for errors in Supabase logs.

### RLS policies blocking queries?

Check policies exist:
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Should see multiple policies per table.

### Functions not working?

Check functions exist:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name LIKE 'admin_%' OR routine_name = 'create_notification';
```

Should see:
- create_notification
- admin_delete_catch
- admin_delete_comment
- admin_restore_catch
- admin_restore_comment
- admin_warn_user

---

## Creating an Admin User

To test moderation features, make yourself an admin:

```sql
-- Replace with your user ID
INSERT INTO admin_users (user_id)
VALUES ('1cb53e69-66d7-4a0a-9727-fb95bec01575');

-- Verify
SELECT
    a.user_id,
    p.username
FROM admin_users a
JOIN profiles p ON a.user_id = p.id;
```

Now you can:
- Access `/admin/reports` page
- Delete/restore catches
- Warn/suspend users

---

## Schema Differences from Phase 1

**Phase 1 (incomplete):**
- profiles, sessions, catches only
- No social features
- No moderation
- No notifications

**Complete Schema (this one):**
- Everything above ✅
- Comments, reactions, ratings, follows ✅
- Full moderation suite ✅
- Notifications system ✅
- Admin RPC functions ✅
- Leaderboard view ✅

---

## Next Steps After Deployment

1. **Test all features:**
   - Log a catch
   - Comment on a catch
   - React to a catch
   - Rate a catch
   - Follow a user

2. **Seed more realistic data** if needed

3. **Set up monitoring:**
   - Check Supabase logs for errors
   - Monitor RLS policy performance
   - Watch for slow queries

4. **Consider backups:**
   - Set up automated backups in Supabase
   - Export data periodically

---

## Success Checklist

- [ ] Migration ran without errors
- [ ] All 15 tables created
- [ ] All 6 RPC functions created
- [ ] Leaderboard view exists
- [ ] Lookup tables seeded
- [ ] Test data created (11 catches)
- [ ] Frontend deployed with latest code
- [ ] Can sign in to app
- [ ] Feed loads without 404 errors
- [ ] Can see catches with ratings/comments placeholders
- [ ] No permission denied errors
- [ ] Can like a catch (test social features)
- [ ] Can comment on a catch
- [ ] Can follow a user
- [ ] Notifications work

---

**You now have a complete, production-ready database schema! 🎣**

Everything your frontend expects is now available. No more missing tables, no more 404 errors.
