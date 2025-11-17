# Phase 1: Core Logging - Setup Guide

Welcome to **Phase 1** of the ReelyRated database rebuild! This phase focuses on the core functionality: user profiles, fishing sessions, and catch logging.

## 📋 What's Included in Phase 1

### Database Tables
- **profiles** - User profiles (1:1 with `auth.users`)
- **sessions** - Fishing trips/outings
- **catches** - Individual fish caught with photos and details
- **water_types** - Lookup table for water types
- **baits** - Lookup table for bait types
- **tags** - Lookup table for methods and tags

### Features
✅ User signup with auto-profile creation
✅ User profile management (username, display name, bio, avatar, location, website)
✅ Create and manage fishing sessions
✅ Log catches with rich data (photos, species, weight, length, bait, method, conditions)
✅ Privacy controls (public, followers, private)
✅ Soft delete for sessions and catches
✅ Basic analytics (catch counts, species breakdowns, venue stats)

### What's NOT in Phase 1
❌ Reactions/Likes (Phase 2)
❌ Comments (Phase 2)
❌ Follows (Phase 2)
❌ Ratings (Phase 2)
❌ Structured Venues table (Phase 3)
❌ Species table (Phase 3)
❌ Notifications (Phase 4)
❌ Reports/Moderation (Phase 4)

---

## 🚀 Getting Started

### Prerequisites

1. **Supabase Project**: You should have a Supabase project set up
2. **Environment Variables**: Add these to your `.env` file:
   ```bash
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Step 1: Apply the Migration

You have two options:

#### Option A: Fresh Database (Recommended for dev/test)

If you're starting fresh or have only test data:

1. **Open Supabase SQL Editor** (Supabase Dashboard → SQL Editor)
2. **Copy and paste** the contents of:
   ```
   supabase/migrations/20251114000000_phase1_core_rebuild.sql
   ```
3. **Run the migration**
4. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   You should see: `baits`, `catches`, `profiles`, `sessions`, `tags`, `water_types`

#### Option B: Update Existing Database

If you have an existing database and want to preserve some data:

1. **Back up your database first!** (Supabase Dashboard → Database → Backups)
2. Review the migration file and comment out any `DROP TABLE` statements for tables you want to keep
3. Manually merge your existing data with the new schema

**Note**: The migration file uses `DROP TABLE IF EXISTS ... CASCADE` which will **delete all data** in those tables. This is safe for dev/test environments but destructive for production.

---

### Step 2: Seed Test Data (Optional but Recommended)

To get realistic test data for development:

1. **Create 3 test users** in Supabase Auth (Dashboard → Authentication → Users → Add User):
   - Email: `mike@test.com`, Password: `TestPass123!`
   - Email: `sarah@test.com`, Password: `TestPass123!`
   - Email: `tom@test.com`, Password: `TestPass123!`

2. **Note the user IDs** (they'll be UUIDs like `a1b2c3d4-...`)

3. **Update the seed file** (`supabase/seed-phase1-test-data.sql`):
   - Replace the placeholder UUIDs with your actual user IDs
   - Or keep the placeholder UUIDs and manually create users with those specific IDs

4. **Run the seed file** in SQL Editor:
   ```sql
   -- Copy contents of supabase/seed-phase1-test-data.sql
   -- Paste and run in SQL Editor
   ```

5. **Verify seed data**:
   ```sql
   SELECT COUNT(*) FROM profiles;   -- Should return 3
   SELECT COUNT(*) FROM sessions;   -- Should return ~9
   SELECT COUNT(*) FROM catches;    -- Should return ~12
   ```

---

### Step 3: Update Your Frontend Code

#### 1. Import the New Types

Replace your old type imports with the new Phase 1 types:

```typescript
// Old (from Supabase generated types)
import type { Database } from '@/integrations/supabase/types';

// New (Phase 1 clean types)
import type {
  UserProfile,
  Session,
  Catch,
  CatchInsert,
  SessionInsert,
} from '@/types/phase1-database';
```

#### 2. Use the Query Helper Functions

Instead of writing raw Supabase queries, use the helper functions:

```typescript
import {
  createSession,
  getUserSessions,
  createCatch,
  getUserCatches,
  getPublicCatchesFeed,
} from '@/lib/supabase-queries';

// Example: Create a session
const newSession = await createSession({
  user_id: user.id,
  title: 'Summer Carp Session',
  venue: 'Farlows Lake',
  date: '2024-08-15',
  notes: 'Great conditions!',
});

// Example: Fetch user's catches
const catches = await getUserCatches(user.id);
```

#### 3. Update Your Forms

Make sure your catch form includes the required fields:
- ✅ `image_url` (required)
- ✅ `title` (required)
- ✅ `species` (required)
- ✅ `caught_at` (required)

All other fields are optional.

---

## 📁 File Structure

Here's what was created for Phase 1:

```
ReelyRated-Codex/
├── supabase/
│   ├── migrations/
│   │   └── 20251114000000_phase1_core_rebuild.sql  ← Main migration
│   └── seed-phase1-test-data.sql                    ← Test data
├── src/
│   ├── types/
│   │   └── phase1-database.ts                       ← TypeScript types
│   └── lib/
│       └── supabase-queries.ts                      ← Query helpers
└── docs/
    ├── PHASE1_README.md                             ← This file
    └── PHASE1_TESTING.md                            ← Testing guide
```

---

## 🧪 Testing

See **[PHASE1_TESTING.md](./PHASE1_TESTING.md)** for:
- Manual testing checklist
- Integration test examples
- E2E test examples (Playwright)

### Quick Manual Test

1. **Sign up** as a new user
2. **Check database**: `SELECT * FROM profiles WHERE username = 'your-username';`
3. **Create a session**: Use your UI or run in SQL Editor:
   ```sql
   INSERT INTO sessions (user_id, title, venue, date, notes)
   VALUES ('your-user-id', 'Test Session', 'Test Lake', '2024-11-14', 'Testing!');
   ```
4. **Create a catch**: Use your UI or run:
   ```sql
   INSERT INTO catches (user_id, image_url, title, species, caught_at)
   VALUES (
     'your-user-id',
     'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800',
     'Test Carp',
     'Common Carp',
     '2024-11-14'
   );
   ```
5. **View in feed**: Query public catches:
   ```sql
   SELECT c.*, p.username, p.display_name
   FROM catches c
   JOIN profiles p ON c.user_id = p.id
   WHERE c.visibility = 'public'
   AND c.deleted_at IS NULL
   ORDER BY c.created_at DESC
   LIMIT 10;
   ```

---

## 🔒 Security (RLS Policies)

Row Level Security is enabled on all tables. Here's what each policy does:

### Profiles
- ✅ **Anyone can view** profiles
- ✅ **Users can update** their own profile
- ❌ Users **cannot** update other users' profiles

### Sessions
- ✅ **Users can view** their own sessions
- ✅ **Users can create** sessions
- ✅ **Users can update** their own sessions
- ✅ **Users can soft delete** their own sessions

### Catches
- ✅ **Anyone can view** public catches
- ✅ **Users can view** their own catches (any visibility)
- ✅ **Users can create** catches
- ❌ **Users cannot update** catches (immutable after creation, per requirements)
- ✅ **Users can soft delete** their own catches

### Lookup Tables (water_types, baits, tags)
- ✅ **Anyone can view** (read-only for now)

---

## 🛠️ Troubleshooting

### Profile not auto-created on signup

**Symptom**: User signs up but no profile appears in `profiles` table

**Solution**:
1. Check if the trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
   ```
2. If missing, re-run the migration (the trigger creation is in there)
3. Check Supabase logs for errors

### Username collision on signup

**Symptom**: Error when signing up: "duplicate key value violates unique constraint"

**Solution**: The trigger automatically appends a random number if there's a collision. If this still fails, check the trigger function in the migration file.

### Can't see catches in public feed

**Symptom**: Created a catch but it doesn't appear in `/feed`

**Checklist**:
- ✅ Is `visibility` set to `'public'`?
- ✅ Is `deleted_at` NULL?
- ✅ Is your RLS policy working? (Try querying as anon user)

### Foreign key constraint errors

**Symptom**: Error when creating catch: "insert or update on table violates foreign key constraint"

**Possible causes**:
- `user_id` doesn't exist in `profiles`
- `session_id` doesn't exist in `sessions`
- `water_type` doesn't exist in `water_types` (this is **not** a FK in Phase 1, it's just text)

---

## 📊 Schema Diagram

Here's a visual of the Phase 1 schema:

```
┌─────────────────┐
│   auth.users    │ (Managed by Supabase)
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│    profiles     │
├─────────────────┤
│ id (PK)         │◄────┐
│ username        │     │
│ display_name    │     │
│ bio             │     │
│ avatar_url      │     │
│ location        │     │
│ website         │     │
└─────────────────┘     │
                        │ 1:many
         ┌──────────────┤
         │              │
         ▼              │
┌─────────────────┐     │
│    sessions     │     │
├─────────────────┤     │
│ id (PK)         │◄──┐ │
│ user_id (FK)    │───┘ │
│ title           │     │
│ venue           │     │
│ date            │     │
│ notes           │     │
│ deleted_at      │     │
└─────────────────┘     │
         │ 1:many       │
         │              │ 1:many
         │              │
         ▼              │
┌─────────────────┐     │
│     catches     │     │
├─────────────────┤     │
│ id (PK)         │     │
│ user_id (FK)    │─────┘
│ session_id (FK) │ (nullable)
│ image_url       │
│ title           │
│ species         │
│ caught_at       │
│ weight          │
│ bait_used       │
│ method          │
│ conditions      │ (JSONB)
│ visibility      │
│ deleted_at      │
└─────────────────┘

Lookup Tables:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ water_types  │  │    baits     │  │     tags     │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ code (PK)    │  │ slug (PK)    │  │ slug (PK)    │
│ label        │  │ label        │  │ label        │
│ group_name   │  │ category     │  │ category     │
└──────────────┘  └──────────────┘  │ method_group │
                                    └──────────────┘
```

---

## ✅ Phase 1 Completion Checklist

Before moving to Phase 2, ensure:

- [ ] Migration applied successfully
- [ ] All 6 tables created (profiles, sessions, catches, water_types, baits, tags)
- [ ] Lookup tables seeded with data
- [ ] Profile auto-creation trigger works
- [ ] Can create sessions
- [ ] Can create catches
- [ ] Soft delete works for sessions and catches
- [ ] RLS policies enforced (can't edit other users' data)
- [ ] Frontend forms use new types
- [ ] Manual tests pass (see PHASE1_TESTING.md)
- [ ] At least basic integration tests passing

---

## 🔜 What's Next: Phase 2

Once Phase 1 is solid, we'll add **social features**:
- Reactions (emoji likes on catches)
- Comments (threaded discussions)
- Follows (follow other anglers)
- Ratings (numeric 1-10 ratings on catches)

---

## 🆘 Need Help?

If you run into issues:

1. **Check Supabase logs** (Dashboard → Logs)
2. **Verify RLS policies** are working (try queries as different users)
3. **Check constraints** (try to insert invalid data and see what errors you get)
4. **Review the migration file** to understand what was created

Common beginner mistakes:
- Forgot to set environment variables
- Using wrong user ID (not matching auth.users)
- Trying to insert data that violates constraints
- RLS blocking queries (not authenticated)

---

Happy fishing! 🎣
