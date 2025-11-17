# Phase 1 Quick Reference

Quick reference for common database operations and queries.

---

## 🔑 Environment Variables

Add to `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📦 Common TypeScript Imports

```typescript
// Types
import type {
  UserProfile,
  Session,
  Catch,
  CatchInsert,
  SessionInsert,
  WaterType,
  Bait,
  Tag,
} from '@/types/phase1-database';

// Query functions
import {
  // Profiles
  getProfile,
  getProfileByUsername,
  updateMyProfile,

  // Sessions
  createSession,
  getUserSessions,
  getSession,
  updateSession,
  deleteSession,

  // Catches
  createCatch,
  getCatch,
  getUserCatches,
  getPublicCatchesFeed,
  deleteCatch,

  // Lookups
  getWaterTypes,
  getBaits,
  getMethods,
} from '@/lib/supabase-queries';
```

---

## 🗄️ Common SQL Queries

### View All Your Catches

```sql
SELECT * FROM catches
WHERE user_id = 'your-user-id'
AND deleted_at IS NULL
ORDER BY caught_at DESC;
```

### View Public Feed

```sql
SELECT
  c.*,
  p.username,
  p.display_name,
  p.avatar_url
FROM catches c
JOIN profiles p ON c.user_id = p.id
WHERE c.visibility = 'public'
AND c.deleted_at IS NULL
ORDER BY c.created_at DESC
LIMIT 20;
```

### Count Catches by Species (for a user)

```sql
SELECT
  species,
  COUNT(*) as catch_count
FROM catches
WHERE user_id = 'your-user-id'
AND deleted_at IS NULL
GROUP BY species
ORDER BY catch_count DESC;
```

### Count Catches by Venue (for a user)

```sql
SELECT
  location as venue,
  COUNT(*) as catch_count
FROM catches
WHERE user_id = 'your-user-id'
AND deleted_at IS NULL
AND location IS NOT NULL
GROUP BY location
ORDER BY catch_count DESC;
```

### Get Heaviest Catches (Leaderboard)

```sql
SELECT
  c.*,
  p.username,
  p.display_name
FROM catches c
JOIN profiles p ON c.user_id = p.id
WHERE c.visibility = 'public'
AND c.deleted_at IS NULL
AND c.weight IS NOT NULL
ORDER BY c.weight DESC
LIMIT 10;
```

### Find a User by Username

```sql
SELECT * FROM profiles
WHERE username = 'carp_mike';
```

### Get Session with All Catches

```sql
SELECT
  s.*,
  json_agg(c.*) as catches
FROM sessions s
LEFT JOIN catches c ON c.session_id = s.id AND c.deleted_at IS NULL
WHERE s.id = 'your-session-id'
AND s.deleted_at IS NULL
GROUP BY s.id;
```

### Soft Delete a Catch

```sql
UPDATE catches
SET deleted_at = NOW()
WHERE id = 'catch-id'
AND user_id = 'your-user-id';
```

### Restore a Soft-Deleted Catch

```sql
UPDATE catches
SET deleted_at = NULL
WHERE id = 'catch-id'
AND user_id = 'your-user-id';
```

---

## 🎣 Example: Create a Catch (TypeScript)

### Minimal Catch (Required Fields Only)

```typescript
const catch = await createCatch({
  user_id: user.id,
  image_url: 'https://example.com/my-carp.jpg',
  title: 'Summer Carp',
  species: 'Common Carp',
  caught_at: '2024-08-15',
});
```

### Full Catch (All Fields)

```typescript
const catch = await createCatch({
  user_id: user.id,
  session_id: sessionId, // Optional: link to a session

  // Required
  image_url: 'https://example.com/my-carp.jpg',
  title: 'Beautiful Mirror Carp',
  species: 'Mirror Carp',
  caught_at: '2024-08-15',

  // Optional details
  description: 'Epic fight on a zig rig! Water was calm and clear.',
  weight: 18.5,
  weight_unit: 'lb_oz',
  length: 32,
  length_unit: 'in',

  // Location
  location: 'Farlows Lake',
  peg_or_swim: 'Peg 12',
  water_type: 'lake',

  // Tactics
  bait_used: 'popup-boilies',
  method: 'zig-rig',
  equipment_used: '3.5lb test curve rod, 12lb mainline',

  // Timing
  time_of_day: 'evening',

  // Flexible data
  conditions: {
    weather: 'sunny',
    temperature: 22,
    water_clarity: 'clear',
    wind_speed: 5,
  },
  tags: ['personal-best', 'zig-rig', 'popup'],
  gallery_photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
  ],
  video_url: 'https://youtube.com/watch?v=...',

  // Privacy
  visibility: 'public',
  hide_exact_spot: false,
  allow_ratings: true,
});
```

---

## 📝 Example: Create a Session (TypeScript)

```typescript
const session = await createSession({
  user_id: user.id,
  title: 'Weekend Carp Trip',
  venue: 'Linear Fisheries - St Johns',
  date: '2024-09-22',
  notes: '48-hour session. Set up in peg 8 with zigs and bottom baits.',
});
```

---

## 👤 Example: Update Profile (TypeScript)

```typescript
const updatedProfile = await updateMyProfile({
  display_name: 'Mike Johnson',
  bio: 'Carp fishing enthusiast from Birmingham',
  location: 'Birmingham, UK',
  website: 'https://carpfishing-mike.com',
  avatar_url: 'https://example.com/avatar.jpg',
});
```

---

## 🔍 Useful Database Checks

### Check if Migration Applied

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should show: `baits`, `catches`, `profiles`, `sessions`, `tags`, `water_types`

### Check Row Counts

```sql
SELECT
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'catches', COUNT(*) FROM catches
UNION ALL
SELECT 'water_types', COUNT(*) FROM water_types
UNION ALL
SELECT 'baits', COUNT(*) FROM baits
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;
```

### Check Triggers

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🚨 Debugging Common Errors

### "insert or update on table violates foreign key constraint"

**Cause**: You're trying to insert a record with a foreign key that doesn't exist.

**Fix**:
- For `user_id`: Make sure the profile exists first
- For `session_id`: Make sure the session exists (or use `NULL` for standalone catches)

### "new row for relation violates check constraint"

**Cause**: Data doesn't meet a constraint (e.g., empty title, negative weight, future date).

**Fix**: Check the constraint name in the error message and review your data.

Examples:
- `title_not_empty`: Title cannot be empty string
- `weight_positive`: Weight must be > 0
- `caught_at_not_future`: Date cannot be in the future

### "permission denied for table"

**Cause**: RLS policy is blocking your query.

**Fix**:
- Make sure you're authenticated (`auth.uid()` returns your user ID)
- Check if the RLS policy allows your operation
- For testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE catches DISABLE ROW LEVEL SECURITY;
  ```
  (Don't forget to re-enable it!)

### "duplicate key value violates unique constraint"

**Cause**: You're trying to insert a record that already exists (e.g., username, email).

**Fix**:
- For usernames: Choose a different username
- For IDs: Let the database generate them (don't specify `id` in INSERT)

---

## 🔐 Security Best Practices

### Never Expose Service Role Key in Frontend

Only use the **anon key** in your React app. The **service role key** bypasses RLS and should only be used server-side.

### Always Use Authenticated Requests

When creating/updating data, make sure the user is logged in:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error('Not authenticated');
}
```

### Validate Data Before Sending to Supabase

Don't rely solely on database constraints. Use a validation library like **Zod** in your forms:

```typescript
import { z } from 'zod';

const catchSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  species: z.string().min(1, 'Species is required'),
  caught_at: z.string().refine(date => new Date(date) <= new Date(), {
    message: 'Date cannot be in the future',
  }),
  weight: z.number().positive().optional(),
  // ... etc
});
```

---

## 💡 Performance Tips

### Use Indexes for Common Queries

The migration already includes indexes for:
- `catches.user_id`
- `catches.caught_at`
- `catches.created_at`
- `catches.species`
- `sessions.user_id`
- `sessions.date`

### Limit Large Queries

Always use `.limit()` or `.range()` for large datasets:

```typescript
// Good ✅
const catches = await supabase
  .from('catches')
  .select('*')
  .limit(20);

// Bad ❌ (could return thousands of rows)
const catches = await supabase
  .from('catches')
  .select('*');
```

### Use Pagination for Feeds

```typescript
const PAGE_SIZE = 20;
const offset = page * PAGE_SIZE;

const { data, count } = await supabase
  .from('catches')
  .select('*, profile:profiles(*)', { count: 'exact' })
  .eq('visibility', 'public')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);
```

---

## 📊 Sample Conditions JSON

The `conditions` field on catches is JSONB. Here are some examples:

### Minimal

```json
{
  "weather": "sunny",
  "temperature": 18
}
```

### Full

```json
{
  "weather": "overcast",
  "temperature": 22,
  "temperature_unit": "C",
  "water_clarity": "clear",
  "water_temp": 18,
  "wind_speed": 10,
  "wind_direction": "SW",
  "pressure": 1013,
  "moon_phase": "waxing_crescent",
  "latitude": 51.7520,
  "longitude": -1.2577
}
```

### Querying JSONB

```sql
-- Find catches on sunny days
SELECT * FROM catches
WHERE conditions->>'weather' = 'sunny';

-- Find catches in warm water (temp > 15)
SELECT * FROM catches
WHERE (conditions->>'water_temp')::numeric > 15;
```

---

## 🧹 Reset Database (Dev Only!)

**⚠️ WARNING: This deletes ALL data!**

```sql
-- Delete all data but keep structure
TRUNCATE catches, sessions, profiles CASCADE;

-- Or drop and recreate everything
-- (Re-run the migration file after this)
DROP TABLE IF EXISTS catches CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS water_types CASCADE;
DROP TABLE IF EXISTS baits CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
```

---

## 📱 Useful Supabase Dashboard Links

- **Table Editor**: View and edit data
- **SQL Editor**: Run custom queries
- **Authentication**: Manage users
- **Logs**: Debug errors
- **Database → Backups**: Restore previous state

---

## ✅ Phase 1 Checklist

Quick checklist to ensure everything is working:

- [ ] Tables created (6 total)
- [ ] Lookup tables seeded (water_types, baits, tags)
- [ ] Can sign up as new user
- [ ] Profile auto-created on signup
- [ ] Can update profile
- [ ] Can create session
- [ ] Can create catch (with required fields)
- [ ] Can view catches in feed
- [ ] Soft delete works
- [ ] RLS policies enforced

---

Happy coding! 🎣
