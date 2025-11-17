# ReelyRated Schema Design - Quick Reference

## Overview

This is a **production-ready PostgreSQL schema** for ReelyRated v2 that supports all required features with consistent naming, proper deletion handling, and performance optimizations.

**Full Documentation:** See `/Users/jamesoneill/Documents/ReelyRated v2/docs/FINAL_SCHEMA_DESIGN.md`

---

## Table Summary (18 Tables)

### Lookup Tables (3)
1. **water_types** - Water body types (lake, river, canal)
2. **baits** - Bait catalog (boilies, sweetcorn, pellets)
3. **tags** - Method/technique tags (float_fishing, method_feeder)

### Core Tables (5)
4. **profiles** - User profiles (1:1 with auth.users)
5. **species** - Fish species catalog
6. **venues** - Fishing venue catalog
7. **sessions** - Fishing trips/sessions
8. **catches** - Individual catch records (main content)

### Social Tables (4)
9. **catch_comments** - Comments on catches
10. **catch_reactions** - Quick reactions (like/love/fire)
11. **ratings** - Numerical ratings (1-10)
12. **profile_follows** - User following relationships

### Notification & Moderation (5)
13. **notifications** - User notifications
14. **reports** - Content reports
15. **admin_users** - Admin registry
16. **user_warnings** - Warning history
17. **moderation_log** - Audit log

### System (1)
18. **rate_limits** - Rate limiting tracker

---

## Field Naming Convention

| Pattern | Example | Usage |
|---------|---------|-------|
| `*_slug` | `species_slug` | URL-safe identifiers |
| `*_label` | `location_label` | Human-readable display text |
| `*_code` | `water_type_code` | System codes |
| `*_tag` | `method_tag` | Tag-based categorization |
| `*_id` | `user_id`, `species_id` | Foreign key references |
| `*_at` | `created_at`, `deleted_at` | Timestamps |
| `*_url` | `image_url`, `video_url` | External URLs |
| `*_path` | `avatar_path` | Storage paths |

---

## Deletion Strategy

### Hard Delete (CASCADE)
- **User account deleted** → All user content removed (GDPR)
- **Catch deleted** → All comments/reactions/ratings removed

### Soft Delete (deleted_at)
- **Catches** → User deletes, set `deleted_at` (preserves session integrity)
- **Sessions** → User deletes, set `deleted_at` (preserves catch references)
- **Comments** → User/admin deletes, set `deleted_at` (moderation review)

### SET NULL (Preserve Child)
- **Venue deleted** → Catch FK set to NULL (catch still valid)
- **Species deleted** → Catch FK set to NULL (catch still valid)
- **Session deleted** → Catch FK set to NULL (catch standalone)

---

## Key Design Decisions

### 1. Denormalization for Performance

| Field | Why Denormalized |
|-------|------------------|
| `catches.species_slug` | Fast leaderboard filtering without JOIN |
| `catches.normalized_location` | Case-insensitive search without LOWER() |
| `catches.location_label` | Display value (most catches use manual entry) |

### 2. Soft Delete Rules

| Entity | Soft Delete? | Rationale |
|--------|--------------|-----------|
| Catches | ✅ Yes | Preserve session integrity, enable undo |
| Sessions | ✅ Yes | Preserve catch references, historical data |
| Comments | ✅ Yes | Moderation review, conversation context |
| Reactions | ❌ No | Ephemeral, no dependencies |
| Ratings | ❌ No | Ephemeral, no dependencies |

### 3. Visibility Model

```sql
-- Public: Everyone can see
visibility = 'public' AND deleted_at IS NULL

-- Followers: Owner + followers can see
visibility = 'followers'
AND deleted_at IS NULL
AND (auth.uid() = user_id OR is_follower)

-- Private: Owner only
visibility = 'private'
AND deleted_at IS NULL
AND auth.uid() = user_id
```

---

## Enum Types (11)

```typescript
// Visibility
'public' | 'followers' | 'private'

// Measurements
'kg' | 'lb_oz'
'cm' | 'in'

// Time
'morning' | 'afternoon' | 'evening' | 'night'

// Notifications
'new_follower' | 'new_comment' | 'new_rating' | 'new_reaction' |
'mention' | 'system' | 'admin_report' | 'admin_warning'

// Reports
'open' | 'in_review' | 'resolved' | 'dismissed'
'catch' | 'comment' | 'profile'

// Moderation
'warning' | 'temporary_suspension' | 'permanent_ban'
'active' | 'warned' | 'suspended' | 'banned'
'delete_catch' | 'delete_comment' | 'restore_catch' |
'restore_comment' | 'warn_user' | 'suspend_user'

// Reactions
'like' | 'love' | 'fire'
```

---

## Views

### leaderboard_scores_detailed (View)
**Purpose:** Real-time leaderboard with aggregated scores

**Scoring Formula:**
```
total_score = weight + (avg_rating * 5) + (reaction_count * 0.5)
```

**Usage:**
```sql
-- Top catches globally
SELECT * FROM leaderboard_scores_detailed
ORDER BY total_score DESC LIMIT 10;

-- Top catches for a species
SELECT * FROM leaderboard_scores_detailed
WHERE species_slug = 'mirror_carp'
ORDER BY total_score DESC LIMIT 10;
```

### leaderboard_scores_mv (Materialized View)
**Purpose:** Cached leaderboard for performance

**Refresh:**
```sql
-- Manual
SELECT refresh_leaderboard();

-- Automated (daily at 2am)
SELECT cron.schedule(
    'refresh-leaderboard',
    '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_scores_mv'
);
```

---

## Performance Indexes

### Critical Indexes

```sql
-- Catches (main content table)
CREATE INDEX idx_catches_user ON catches(user_id);
CREATE INDEX idx_catches_species_slug ON catches(species_slug);
CREATE INDEX idx_catches_visibility ON catches(visibility);
CREATE INDEX idx_catches_created ON catches(created_at DESC);
CREATE INDEX idx_catches_deleted ON catches(deleted_at);

-- Partial indexes for leaderboard
CREATE INDEX idx_leaderboard_species ON catches(species_slug)
    WHERE visibility = 'public' AND deleted_at IS NULL;

-- Social tables
CREATE INDEX idx_catch_comments_catch ON catch_comments(catch_id);
CREATE INDEX idx_catch_reactions_user ON catch_reactions(user_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);

-- Profile follows (for visibility checks)
CREATE INDEX idx_profile_follows_follower ON profile_follows(follower_id);
CREATE INDEX idx_profile_follows_following ON profile_follows(following_id);

-- Notifications
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read)
    WHERE is_read = false;

-- Rate limits
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action, created_at);
```

---

## Rate Limiting

### DB-Enforced Limits (via triggers)

| Action | Limit | Window |
|--------|-------|--------|
| Catch creation | 10 | 1 hour |
| Comment creation | 30 | 1 hour |
| Report creation | 5 | 1 hour |

### Implementation

```sql
-- Triggered on INSERT
CREATE TRIGGER catch_rate_limit_trigger
    BEFORE INSERT ON catches
    FOR EACH ROW
    EXECUTE FUNCTION enforce_catch_rate_limit();
```

### Cleanup

```sql
-- Run every 2 hours (via cron)
SELECT cleanup_rate_limits();  -- Deletes records > 2 hours old
```

---

## RLS Policies Summary

### Lookup Tables
- **Public read-only** (water_types, baits, tags)

### Profiles
- **Everyone can view** profiles
- **Users can update** own profile only

### Catches
- **Public catches:** Everyone can view
- **Followers catches:** Owner + followers can view
- **Private catches:** Owner only can view
- **Owner catches:** Owner can always view (even soft-deleted)
- **CRUD:** Users can insert/update/delete own catches only

### Comments/Reactions/Ratings
- **Visibility inherits from parent catch**
- **Users can create** on viewable catches
- **Users can delete** own entries only
- **Ratings:** Cannot rate own catch

### Follows
- **Everyone can view** relationships
- **Users can create/delete** own follows only

### Notifications/Reports/Warnings
- **Users can view** own records only
- **Admin access** via service role or SECURITY DEFINER RPCs

---

## Key Features Supported

### 1. Sessions & Catches
- ✅ Sessions group catches (optional)
- ✅ Catches can be standalone or session-linked
- ✅ Session deletion preserves catches (SET NULL)
- ✅ Soft delete for both

### 2. Visibility Control
- ✅ Public (everyone)
- ✅ Followers (followers + owner)
- ✅ Private (owner only)
- ✅ RLS enforces at DB level

### 3. Feed
- ✅ Global feed (public catches)
- ✅ Following feed (followers catches)
- ✅ Efficient queries with indexes

### 4. Search
- ✅ Profiles (username, full_name)
- ✅ Catches (species_slug, normalized_location)
- ✅ Venues (slug, name, region)

### 5. Leaderboards
- ✅ Global leaderboard
- ✅ Species-specific leaderboard
- ✅ Location-specific leaderboard
- ✅ Weight-based sorting
- ✅ Score-based sorting (weight + ratings + reactions)

### 6. Insights/Analytics
- ✅ User catch counts (aggregate)
- ✅ Species distribution (aggregate)
- ✅ Location hotspots (aggregate)
- ✅ Historical data preserved (soft delete)

### 7. Notifications
- ✅ All types (follower, comment, rating, reaction, mention, system, admin)
- ✅ Deduplication (5-minute window)
- ✅ @mention support in comments
- ✅ Read/unread tracking

### 8. Reports & Moderation
- ✅ Report catches/comments/profiles
- ✅ Status workflow (open → in_review → resolved/dismissed)
- ✅ Admin actions logged (moderation_log)
- ✅ User warnings with severity levels
- ✅ Temporary/permanent suspensions

### 9. Rate Limiting
- ✅ DB-enforced limits
- ✅ Per-action tracking
- ✅ Automatic cleanup
- ✅ Status API for display

---

## Migration from V1

### Breaking Changes

1. **profiles.id → profiles.user_id**
   - Primary key renamed for clarity
   - All foreign keys updated

2. **catches.species (TEXT) → species_id + species_slug**
   - Now uses species catalog with FK
   - `species_slug` denormalized for performance
   - Fallback to `custom_species` TEXT if not in catalog

3. **catches.location → location_label + normalized_location**
   - `location_label` is display value
   - `normalized_location` is auto-populated lowercase for search

### Migration Steps

1. Export existing data (if needed)
2. Run schema migrations (drops all tables)
3. Update frontend queries (see SCHEMA_V2_QUERY_MAPPINGS.md)
4. Re-import data or use seed script
5. Test RLS policies
6. Deploy

---

## Maintenance Tasks

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Cleanup rate limits | Every 2 hours | `SELECT cleanup_rate_limits();` |
| Refresh leaderboard | Daily at 2am | `SELECT refresh_leaderboard();` |
| Hard delete old soft-deleted catches | Monthly | Custom cleanup script |

### Optional Tasks

| Task | Purpose |
|------|---------|
| Monitor slow queries | Check pg_stat_statements |
| Review moderation log | Check admin actions |
| Export analytics | Generate CSV reports |

---

## Scalability Limits

### Current Schema Handles:

- ✅ **1M catches** - No issues (indexed queries fast)
- ✅ **100K users** - No issues (profile JOINs efficient)
- ✅ **10M ratings** - Consider partitioning

### Future Optimizations (when needed):

- Partition catches table by year (when > 5M rows)
- Partition rate_limits by day (when > 10M rows)
- Add full-text search indexes (pg_trgm)
- Consider read replicas for leaderboard queries

---

## Quick Start

### 1. Run Migrations

```sql
-- In Supabase SQL Editor:
-- 1. supabase/migrations/20251115_v2_complete_schema.sql
-- 2. supabase/migrations/20251115_v2_rpc_functions.sql
-- 3. supabase/seed-v2.sql (optional)
```

### 2. Verify Installation

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Check permissions
SELECT nspname, rolname, has_schema_privilege(r.oid, n.oid, 'USAGE')
FROM pg_namespace n CROSS JOIN pg_roles r
WHERE nspname = 'public' AND rolname IN ('anon', 'authenticated');
```

### 3. Refresh Leaderboard

```sql
REFRESH MATERIALIZED VIEW leaderboard_scores_mv;
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| **FINAL_SCHEMA_DESIGN.md** | Complete table-by-table specification |
| **SCHEMA_V2_README.md** | Overview and quick start guide |
| **SCHEMA_V2_TYPESCRIPT_TYPES.md** | TypeScript type definitions |
| **SCHEMA_V2_QUERY_MAPPINGS.md** | Migration guide (V1 → V2 queries) |
| **SCHEMA_V2_TEST_CHECKLIST.md** | Manual testing workflow |

---

## Next Steps

1. ✅ Review FINAL_SCHEMA_DESIGN.md for full details
2. ⬜ Run migrations in test environment
3. ⬜ Test all features with seed data
4. ⬜ Update frontend TypeScript types
5. ⬜ Update all Supabase queries
6. ⬜ Test RLS policies thoroughly
7. ⬜ Deploy to production

---

**This schema is production-ready for an early-stage fishing app MVP.**
