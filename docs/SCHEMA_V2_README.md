# ReelyRated Schema V2 - Complete Database Rebuild

## 🎯 Overview

This is a **comprehensive, production-ready database schema** for ReelyRated that supports ALL features:

- ✅ Auth & profiles
- ✅ Sessions & catches
- ✅ Feed (global + following)
- ✅ Search (profiles, catches, venues)
- ✅ Venue detail pages
- ✅ Leaderboards + hero spotlight
- ✅ Insights/analytics
- ✅ Notifications (all types including @mentions)
- ✅ Reports & admin moderation
- ✅ DB-driven rate limiting

---

## 📁 Files Included

### SQL Migrations
1. **`supabase/migrations/20251115_v2_complete_schema.sql`** (1,085 lines)
   - All 16 tables with PKs, FKs, constraints
   - All RLS policies
   - All triggers (auto-create profile, update timestamps, normalize location)
   - Leaderboard views (regular + materialized)
   - Schema permissions grants

2. **`supabase/migrations/20251115_v2_rpc_functions.sql`** (380 lines)
   - Auth: `check_email_exists`
   - Notifications: `create_notification`, `notify_admins`
   - Admin: `admin_delete_catch`, `admin_restore_catch`, `admin_delete_comment`, `admin_restore_comment`, `admin_warn_user`
   - Rate Limiting: `check_rate_limit`, `get_rate_limit_status`, `user_rate_limits`, `cleanup_rate_limits`
   - Triggers: catch/comment/report rate limiting

3. **`supabase/seed-v2.sql`** (180 lines)
   - 3 test profiles (mike, sarah, tom)
   - 8 species (carp, pike, perch, roach, etc.)
   - 3 venues (Linear Fisheries, Wraysbury River, Blenheim Palace)
   - 5 sessions
   - 6 catches with full details
   - Comments, ratings, reactions, follows
   - Lookup data (water types, baits, tags)

### Documentation
4. **`docs/SCHEMA_V2_TYPESCRIPT_TYPES.md`**
   - Complete TypeScript type definitions for all entities
   - Enums matching DB enums
   - Insert/Update types
   - Relation types (e.g., `CatchWithRelations`)
   - Example usage

5. **`docs/SCHEMA_V2_QUERY_MAPPINGS.md`**
   - Migration guide: OLD schema → NEW schema
   - Side-by-side query examples
   - Breaking changes highlighted
   - Update checklist

6. **`docs/SCHEMA_V2_TEST_CHECKLIST.md`**
   - Complete manual testing workflow
   - 13 test categories with checkboxes
   - Assumptions documented
   - Deployment checklist

---

## 🚀 Quick Start

### Step 1: Run Migrations

```sql
-- In Supabase SQL Editor, run in order:

-- 1. Schema migration (tables, views, policies)
-- Copy/paste: supabase/migrations/20251115_v2_complete_schema.sql

-- 2. RPC functions migration
-- Copy/paste: supabase/migrations/20251115_v2_rpc_functions.sql

-- 3. Seed data (optional, for testing)
-- Copy/paste: supabase/seed-v2.sql

-- 4. Refresh leaderboard (if using materialized view)
REFRESH MATERIALIZED VIEW leaderboard_scores_mv;
```

### Step 2: Verify Installation

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see: admin_users, baits, catches, catch_comments, catch_reactions,
-- moderation_log, notifications, profile_follows, profiles, rate_limits,
-- ratings, reports, sessions, species, tags, user_warnings, venues, water_types

-- Check schema permissions
SELECT nspname, rolname, has_schema_privilege(r.oid, n.oid, 'USAGE') as has_usage
FROM pg_namespace n
CROSS JOIN pg_roles r
WHERE nspname = 'public'
AND rolname IN ('anon', 'authenticated')
ORDER BY rolname;

-- Both should show TRUE
```

### Step 3: Update Frontend

See `docs/SCHEMA_V2_QUERY_MAPPINGS.md` for complete guide.

**Key Changes:**
- `profiles.id` → `profiles.user_id`
- Add `species` and `venues` table joins
- Use `species_slug` for filtering
- Use `leaderboard_scores_detailed` view

---

## 📊 Schema Overview

### Core Tables
- **profiles** - User profiles (1:1 with auth.users)
- **species** - Fish species catalog
- **venues** - Fishing venue catalog
- **sessions** - Fishing sessions/trips
- **catches** - Catch records (can link to session, venue, species)

### Social Tables
- **catch_comments** - Comments on catches
- **catch_reactions** - Reactions (like/love/fire)
- **ratings** - 1-10 ratings on catches
- **profile_follows** - User following relationships

### Notification & Moderation
- **notifications** - User notifications
- **reports** - Content reports
- **admin_users** - Admin registry
- **user_warnings** - Warning history
- **moderation_log** - Audit log

### System
- **rate_limits** - Rate limiting tracker
- **water_types**, **baits**, **tags** - Lookup tables

### Views
- **leaderboard_scores_detailed** - Real-time leaderboard
- **leaderboard_scores_mv** - Materialized (faster, needs refresh)

---

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Public catches visible to everyone
- ✅ Followers catches visible to followers only
- ✅ Private catches visible to owner only
- ✅ Users can only update own data
- ✅ Admin actions via SECURITY DEFINER RPCs

### Rate Limiting (DB-Enforced)
- 10 catches per hour (via trigger)
- 30 comments per hour (via trigger)
- 5 reports per hour (via trigger)

### Soft Delete
- Catches, sessions, comments use `deleted_at`
- Preserves data for moderation
- Excludes from public views automatically

---

## 🎨 Key Features

### 1. Species & Venue Catalogs
```sql
-- Pre-populated species
SELECT * FROM species;

-- Pre-populated venues
SELECT * FROM venues;

-- OR use custom_species / venue_name_manual for unlisted entries
```

### 2. Flexible Catch Data
```sql
-- JSONB conditions for extensibility
INSERT INTO catches (conditions) VALUES (
  '{"weather": "sunny", "wind": "light", "moon_phase": "full"}'::jsonb
);
```

### 3. Leaderboard Scoring
```
total_score = weight + (avg_rating * 5) + (reaction_count * 0.5)
```

Filter by species:
```sql
SELECT * FROM leaderboard_scores_mv
WHERE species_slug = 'mirror_carp'
ORDER BY total_score DESC;
```

### 4. Notification Deduplication
```sql
-- Prevents duplicate notifications within 5 minutes
SELECT create_notification(...);
```

### 5. Admin Moderation
```sql
-- All admin actions logged
SELECT * FROM moderation_log
WHERE action = 'delete_catch'
ORDER BY created_at DESC;
```

---

## 🧪 Testing

See `docs/SCHEMA_V2_TEST_CHECKLIST.md` for complete manual test workflow.

**Quick Smoke Test:**
```sql
-- 1. Verify seed data
SELECT 'Profiles:', COUNT(*) FROM profiles
UNION ALL
SELECT 'Catches:', COUNT(*) FROM catches WHERE deleted_at IS NULL
UNION ALL
SELECT 'Leaderboard:', COUNT(*) FROM leaderboard_scores_detailed;

-- 2. Test rate limiting
SELECT check_rate_limit('<user-id>', 'catch_creation', 10, 60);

-- 3. Test leaderboard
SELECT * FROM leaderboard_scores_mv ORDER BY total_score DESC LIMIT 5;
```

---

## 📈 Performance

### Indexes Created
- All PKs, FKs, and unique constraints
- `catches`: user_id, session_id, venue_id, species_id, species_slug, visibility, created_at, caught_at, normalized_location
- `catch_comments`, `catch_reactions`, `ratings`: catch_id, user_id
- `profile_follows`: follower_id, following_id
- `notifications`: user_id, unread index
- `reports`, `moderation_log`: status, target type/id
- Leaderboard materialized view: id, species_slug, total_score, weight

### Materialized View Refresh
```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_scores_mv;

-- OR set up cron job (Supabase Dashboard → Database → Cron Jobs)
-- Run daily at 2am:
SELECT cron.schedule('refresh-leaderboard', '0 2 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_scores_mv');
```

---

## 🔄 Migration from V1

### Breaking Changes
1. **profiles.id → profiles.user_id**
2. **catches.species (TEXT) → species_id + species_slug**
3. **catches.location → location_label + normalized_location**
4. **No `deleted_at` on sessions** (current schema has it, V2 keeps it)

### Migration Steps
1. Export existing data (if needed)
2. Run new schema migrations (drops all tables)
3. Update frontend queries (see SCHEMA_V2_QUERY_MAPPINGS.md)
4. Re-import data (or use seed script for testing)
5. Test RLS policies
6. Deploy

---

## 🛠️ Maintenance

### Regular Tasks
- **Cleanup rate limits**: Run `cleanup_rate_limits()` every 2-4 hours
- **Refresh leaderboard**: Run `refresh_leaderboard()` daily
- **Monitor query performance**: Check slow queries, add indexes as needed
- **Review moderation log**: Check admin actions for audit

### Optional Enhancements
- Full-text search with `pg_trgm` or external search engine
- Image thumbnails and optimization
- Export insights to CSV/PDF
- Weather API integration
- Catch verification (GPS, photo metadata)

---

## 📞 Support

For questions or issues:
1. Check `SCHEMA_V2_TEST_CHECKLIST.md` for troubleshooting
2. Review `SCHEMA_V2_QUERY_MAPPINGS.md` for query examples
3. Check Supabase logs for RLS/permission errors

---

## ✅ Checklist

- [ ] Run schema migration
- [ ] Run RPC functions migration
- [ ] Run seed data (or import production data)
- [ ] Refresh materialized view
- [ ] Update frontend TypeScript types
- [ ] Update all Supabase queries
- [ ] Test RLS policies
- [ ] Test rate limiting
- [ ] Test admin functions
- [ ] Deploy to production

---

**This schema is production-ready for an early-stage fishing app.** It supports all core features with proper security, performance, and extensibility. 🎣
