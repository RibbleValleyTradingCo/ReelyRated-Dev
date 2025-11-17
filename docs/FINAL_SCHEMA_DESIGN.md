# ReelyRated Final Schema Design V2

## Executive Summary

This document presents the **final, production-ready database schema** for ReelyRated based on analysis of the existing V2 schema. This design:

- Supports ALL required features (auth, sessions, catches, feed, search, leaderboards, notifications, moderation, rate limiting)
- Uses consistent field naming following the v2 migration pattern
- Implements proper soft delete with clear deletion rules
- Balances normalization vs denormalization for performance
- Provides complete table specifications with indexes and constraints

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Enum Types](#enum-types)
3. [Lookup Tables](#lookup-tables)
4. [Core Tables](#core-tables)
5. [Social Tables](#social-tables)
6. [Notification & Moderation](#notification--moderation)
7. [System Tables](#system-tables)
8. [Views & Materialized Views](#views--materialized-views)
9. [Normalization Strategy](#normalization-strategy)
10. [Deletion Rules](#deletion-rules)
11. [Performance Considerations](#performance-considerations)

---

## Core Principles

### Field Naming Convention
**Pattern:** Snake_case with descriptive suffixes
- `*_slug` - URL-safe identifiers (species_slug, venue_slug)
- `*_label` - Human-readable display text (location_label)
- `*_code` - System codes (water_type_code)
- `*_tag` - Tag-based categorization (method_tag)
- `*_id` - Foreign key references (user_id, species_id)
- `*_at` - Timestamps (created_at, deleted_at)
- `*_url` - External URLs (image_url, video_url)
- `*_path` - Storage paths (avatar_path)

### Soft Delete Strategy
- **Catches**: Use `deleted_at` (user-initiated, preserves data for sessions/analytics)
- **Comments**: Use `deleted_at` (moderation-friendly, preserves context)
- **Sessions**: Use `deleted_at` (preserves historical data, catches reference via ON DELETE SET NULL)
- **Profiles**: Hard delete via CASCADE (GDPR compliance, user deletion removes all content)

### Referential Integrity
- **Profiles → Catches/Sessions**: `ON DELETE CASCADE` (remove all user content)
- **Sessions → Catches**: `ON DELETE SET NULL` (preserve catches even if session deleted)
- **Venues/Species → Catches**: `ON DELETE SET NULL` (preserve catches if catalog entry removed)
- **Catches → Comments/Reactions/Ratings**: `ON DELETE CASCADE` (remove engagement data with parent)

---

## Enum Types

### Database Enums

```sql
-- Visibility control for catches
CREATE TYPE visibility_type AS ENUM ('public', 'followers', 'private');

-- Weight measurement units
CREATE TYPE weight_unit AS ENUM ('kg', 'lb_oz');

-- Length measurement units
CREATE TYPE length_unit AS ENUM ('cm', 'in');

-- Time of day categorization
CREATE TYPE time_of_day AS ENUM ('morning', 'afternoon', 'evening', 'night');

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'new_follower',      -- Someone followed you
    'new_comment',       -- Comment on your catch
    'new_rating',        -- Rating on your catch
    'new_reaction',      -- Reaction on your catch
    'mention',           -- @mentioned in comment
    'system',            -- System announcements
    'admin_report',      -- Report submitted (admin only)
    'admin_warning'      -- Warning issued
);

-- Report status workflow
CREATE TYPE report_status AS ENUM ('open', 'in_review', 'resolved', 'dismissed');

-- Report target types
CREATE TYPE report_target_type AS ENUM ('catch', 'comment', 'profile');

-- Warning severity levels
CREATE TYPE warning_severity AS ENUM ('warning', 'temporary_suspension', 'permanent_ban');

-- User moderation status
CREATE TYPE moderation_status AS ENUM ('active', 'warned', 'suspended', 'banned');

-- Moderation actions
CREATE TYPE mod_action AS ENUM (
    'delete_catch',
    'delete_comment',
    'restore_catch',
    'restore_comment',
    'warn_user',
    'suspend_user'
);

-- Reaction types
CREATE TYPE reaction_type AS ENUM ('like', 'love', 'fire');
```

---

## Lookup Tables

### 1. water_types

**Purpose:** Standardized water body types for filtering and categorization

```sql
CREATE TABLE water_types (
    code TEXT PRIMARY KEY,                          -- e.g., 'lake', 'river', 'canal'
    label TEXT NOT NULL,                            -- e.g., 'Lake', 'River', 'Canal'
    group_name TEXT,                                -- e.g., 'freshwater', 'saltwater'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
-- (Primary key index on code is automatic)

-- RLS
ALTER TABLE water_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Water types are viewable by everyone"
    ON water_types FOR SELECT USING (true);

-- Sample Data
-- lake, river, canal, pond, reservoir, sea, ocean
```

### 2. baits

**Purpose:** Standardized bait catalog for filtering and statistics

```sql
CREATE TABLE baits (
    slug TEXT PRIMARY KEY,                          -- e.g., 'boilies', 'sweetcorn', 'pellets'
    label TEXT NOT NULL,                            -- e.g., 'Boilies', 'Sweetcorn', 'Pellets'
    category TEXT NOT NULL,                         -- e.g., 'particle', 'lure', 'live'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
-- (Primary key index on slug is automatic)

-- RLS
ALTER TABLE baits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Baits are viewable by everyone"
    ON baits FOR SELECT USING (true);

-- Sample Data
-- boilies, sweetcorn, pellets, bread, worms, maggots, lures, flies
```

### 3. tags

**Purpose:** Fishing method/technique tags for filtering and categorization

```sql
CREATE TABLE tags (
    slug TEXT PRIMARY KEY,                          -- e.g., 'float_fishing', 'method_feeder'
    label TEXT NOT NULL,                            -- e.g., 'Float Fishing', 'Method Feeder'
    category TEXT NOT NULL,                         -- e.g., 'method', 'technique', 'rig'
    method_group TEXT,                              -- e.g., 'leger', 'fly', 'specialist'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
-- (Primary key index on slug is automatic)

-- RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by everyone"
    ON tags FOR SELECT USING (true);

-- Sample Data
-- float_fishing, method_feeder, zig_rig, fly_fishing, stalking
```

---

## Core Tables

### 4. profiles

**Purpose:** User profile data (1:1 with auth.users)

```sql
CREATE TABLE profiles (
    -- Identity
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username CITEXT NOT NULL UNIQUE,                -- URL-safe, case-insensitive
    full_name TEXT,                                 -- Display name

    -- Profile info
    avatar_path TEXT,                               -- Storage path (preferred)
    avatar_url TEXT,                                -- Legacy field
    bio TEXT,
    location TEXT,                                  -- User's home location
    website TEXT,

    -- Moderation
    warn_count INTEGER DEFAULT 0,
    moderation_status moderation_status DEFAULT 'active',
    suspension_until TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30),
    CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_moderation_status ON profiles(moderation_status);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Triggers
-- Auto-create profile on user signup (see handle_new_user function)
-- Update updated_at on changes (see update_updated_at_column function)

-- ON DELETE behavior: CASCADE from auth.users
-- Rationale: GDPR compliance - user deletion removes all profile data
```

**Key Design Decisions:**
- Uses `user_id` instead of `id` for clarity (matches auth.users.id)
- CITEXT for username enables case-insensitive uniqueness
- Moderation fields integrated (avoids separate table for simple status)
- Full name is optional (some users prefer username only)

### 5. species

**Purpose:** Fish species catalog for catches

```sql
CREATE TABLE species (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug CITEXT UNIQUE NOT NULL,                    -- URL-safe identifier (e.g., 'mirror_carp')

    -- Names
    common_name TEXT NOT NULL,                      -- e.g., 'Mirror Carp'
    scientific_name TEXT,                           -- e.g., 'Cyprinus carpio'

    -- Classification
    category TEXT,                                  -- e.g., 'coarse', 'game', 'sea'

    -- Records
    record_weight NUMERIC(8,2),                     -- World/UK record weight
    record_weight_unit weight_unit,

    -- Media
    image_url TEXT,                                 -- Species illustration/photo

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_species_slug ON species(slug);
CREATE INDEX idx_species_category ON species(category);

-- RLS
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Species are viewable by everyone"
    ON species FOR SELECT USING (true);

-- Sample Data
-- common_carp, mirror_carp, pike, perch, roach, bream, tench, barbel
```

**Key Design Decisions:**
- Separate `id` and `slug` (UUID for stability, slug for URLs)
- Record weights included for leaderboard context
- Category enables filtering (coarse/game/sea/predator)
- Catches can still use `custom_species` TEXT if not in catalog

### 6. venues

**Purpose:** Fishing venue catalog for catches and sessions

```sql
CREATE TABLE venues (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug CITEXT UNIQUE NOT NULL,                    -- URL-safe identifier

    -- Details
    name TEXT NOT NULL,
    region TEXT,                                    -- County/State
    country TEXT,

    -- Location
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    -- Info
    description TEXT,
    image_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_location ON venues(latitude, longitude)
    WHERE latitude IS NOT NULL;

-- RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues are viewable by everyone"
    ON venues FOR SELECT USING (true);

-- Sample Data
-- linear_fisheries, wraysbury_river, blenheim_palace_lake
```

**Key Design Decisions:**
- Separate `id` and `slug` (UUID for stability, slug for URLs)
- Coordinates optional (enables map features later)
- Catches/sessions can use `venue_name_manual` TEXT if not in catalog
- Future: User-submitted venues with approval workflow

### 7. sessions

**Purpose:** Fishing trip/session records (container for multiple catches)

```sql
CREATE TABLE sessions (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,

    -- Session details
    title TEXT NOT NULL,
    venue_name_manual TEXT,                         -- If not using venue_id
    date DATE,
    notes TEXT,

    -- Soft delete
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0)
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_venue ON sessions(venue_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_deleted ON sessions(deleted_at);

-- RLS Policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions are viewable by owner"
    ON sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE USING (auth.uid() = user_id);

-- Triggers
-- Update updated_at on changes

-- ON DELETE behavior from venues: SET NULL
-- Rationale: Preserve session if venue removed from catalog
```

**Key Design Decisions:**
- Private to owner only (sessions are personal trip logs)
- Soft delete preserves historical data
- Venue can be FK reference OR manual text
- Date is optional (some users log retroactively)

### 8. catches

**Purpose:** Individual catch records (core content entity)

```sql
CREATE TABLE catches (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    species_id UUID REFERENCES species(id) ON DELETE SET NULL,

    -- Required fields
    image_url TEXT NOT NULL,                        -- Main photo (required)
    title TEXT NOT NULL,
    caught_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- When fish was caught

    -- Optional descriptive fields
    description TEXT,
    species_slug CITEXT,                            -- Denormalized for filtering
    custom_species TEXT,                            -- If not in species catalog

    -- Fish measurements
    weight NUMERIC(8,2),
    weight_unit weight_unit DEFAULT 'lb_oz',
    length NUMERIC(8,2),
    length_unit length_unit DEFAULT 'cm',

    -- Location details
    location_label TEXT,                            -- Venue name or description
    normalized_location CITEXT,                     -- Auto-populated, case-insensitive
    water_type_code TEXT,                           -- FK to water_types (soft)

    -- Tactics/Method
    bait_used TEXT,                                 -- FK to baits (soft)
    method_tag TEXT,                                -- FK to tags (soft)
    equipment_used TEXT,                            -- Free text

    -- Timing
    time_of_day time_of_day,

    -- Flexible data
    conditions JSONB DEFAULT '{}'::jsonb,           -- Weather, water, etc.
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],            -- Free-form tags
    gallery_photos TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Additional photos (max 6)
    video_url TEXT,

    -- Privacy settings
    visibility visibility_type NOT NULL DEFAULT 'public',
    hide_exact_spot BOOLEAN DEFAULT false,
    allow_ratings BOOLEAN DEFAULT true,

    -- Soft delete & timestamps
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT weight_non_negative CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT length_non_negative CHECK (length IS NULL OR length >= 0)
);

-- Indexes
CREATE INDEX idx_catches_user ON catches(user_id);
CREATE INDEX idx_catches_session ON catches(session_id);
CREATE INDEX idx_catches_venue ON catches(venue_id);
CREATE INDEX idx_catches_species ON catches(species_id);
CREATE INDEX idx_catches_species_slug ON catches(species_slug);
CREATE INDEX idx_catches_visibility ON catches(visibility);
CREATE INDEX idx_catches_deleted ON catches(deleted_at);
CREATE INDEX idx_catches_created ON catches(created_at DESC);
CREATE INDEX idx_catches_caught_at ON catches(caught_at DESC);
CREATE INDEX idx_catches_location ON catches(normalized_location)
    WHERE normalized_location IS NOT NULL;

-- Leaderboard-specific indexes
CREATE INDEX idx_leaderboard_species ON catches(species_slug)
    WHERE visibility = 'public' AND deleted_at IS NULL;
CREATE INDEX idx_leaderboard_location ON catches(normalized_location)
    WHERE visibility = 'public' AND deleted_at IS NULL;

-- RLS Policies
ALTER TABLE catches ENABLE ROW LEVEL SECURITY;

-- Public catches viewable by everyone
CREATE POLICY "Public catches are viewable by everyone"
    ON catches FOR SELECT
    USING (visibility = 'public' AND deleted_at IS NULL);

-- Followers-only catches viewable by followers and owner
CREATE POLICY "Followers catches viewable by followers"
    ON catches FOR SELECT
    USING (
        visibility = 'followers'
        AND deleted_at IS NULL
        AND (
            auth.uid() = user_id
            OR EXISTS (
                SELECT 1 FROM profile_follows
                WHERE follower_id = auth.uid() AND following_id = user_id
            )
        )
    );

-- Private catches viewable by owner only
CREATE POLICY "Private catches viewable by owner"
    ON catches FOR SELECT
    USING (visibility = 'private' AND auth.uid() = user_id AND deleted_at IS NULL);

-- Owner can always view their own catches (even soft-deleted)
CREATE POLICY "Users can view own catches"
    ON catches FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE policies
CREATE POLICY "Users can insert own catches"
    ON catches FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catches"
    ON catches FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete own catches"
    ON catches FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Triggers
-- 1. Update updated_at on changes
-- 2. Auto-populate normalized_location from location_label
-- 3. Rate limiting (max 10 catches per hour)

-- ON DELETE behavior:
-- - From users: CASCADE (remove all catches when user deleted)
-- - From sessions: SET NULL (preserve catch even if session deleted)
-- - From venues: SET NULL (preserve catch even if venue removed)
-- - From species: SET NULL (preserve catch even if species removed)
```

**Key Design Decisions:**
- **Dual species system**: `species_id` (normalized FK) + `species_slug` (denormalized for speed)
- **Dual location system**: `location_label` (display) + `normalized_location` (search/filter)
- **Soft FK references**: `water_type_code`, `bait_used`, `method_tag` reference lookups but not enforced (allows manual entry)
- **JSONB conditions**: Extensible for custom fields (weather, GPS, moon phase, etc.)
- **Visibility-aware RLS**: Complex policies handle public/followers/private scenarios
- **Soft delete**: Preserves data for session integrity and moderation review

---

## Social Tables

### 9. catch_comments

**Purpose:** Comments on catches

```sql
CREATE TABLE catch_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,

    body TEXT NOT NULL,
    mentioned_usernames TEXT[] DEFAULT ARRAY[]::TEXT[],  -- For @mentions

    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT body_not_empty CHECK (length(trim(body)) > 0)
);

-- Indexes
CREATE INDEX idx_catch_comments_catch ON catch_comments(catch_id);
CREATE INDEX idx_catch_comments_user ON catch_comments(user_id);
CREATE INDEX idx_catch_comments_created ON catch_comments(created_at DESC);
CREATE INDEX idx_catch_comments_deleted ON catch_comments(deleted_at);

-- RLS
ALTER TABLE catch_comments ENABLE ROW LEVEL SECURITY;

-- Comments visible if parent catch is visible
CREATE POLICY "Comments viewable if catch viewable"
    ON catch_comments FOR SELECT
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM catches
            WHERE id = catch_id
            AND (
                (visibility = 'public' AND deleted_at IS NULL)
                OR (visibility = 'followers' AND deleted_at IS NULL AND (
                    auth.uid() = catches.user_id
                    OR EXISTS (SELECT 1 FROM profile_follows
                               WHERE follower_id = auth.uid()
                               AND following_id = catches.user_id)
                ))
                OR (visibility = 'private' AND auth.uid() = catches.user_id AND deleted_at IS NULL)
                OR auth.uid() = catches.user_id
            )
        )
    );

CREATE POLICY "Users can insert comments on viewable catches"
    ON catch_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM catches
            WHERE id = catch_id
            AND deleted_at IS NULL
            AND (
                visibility = 'public'
                OR (visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM profile_follows
                    WHERE follower_id = auth.uid() AND following_id = catches.user_id
                ))
                OR auth.uid() = catches.user_id
            )
        )
    );

CREATE POLICY "Users can soft-delete own comments"
    ON catch_comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Triggers
-- Rate limiting (max 30 comments per hour)

-- ON DELETE behavior:
-- - From catches: CASCADE (remove comments with parent catch)
-- - From users: CASCADE (remove all user's comments)
```

**Key Design Decisions:**
- Soft delete for moderation (admins can review deleted comments)
- `mentioned_usernames` array enables @mention notifications
- Visibility inherits from parent catch (complex RLS policy)
- No threading (future enhancement)

### 10. catch_reactions

**Purpose:** Quick reactions to catches (like, love, fire)

```sql
CREATE TABLE catch_reactions (
    catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    reaction reaction_type NOT NULL DEFAULT 'like',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (catch_id, user_id)  -- One reaction per user per catch
);

-- Indexes
CREATE INDEX idx_catch_reactions_user ON catch_reactions(user_id);
CREATE INDEX idx_catch_reactions_created ON catch_reactions(created_at DESC);

-- RLS
ALTER TABLE catch_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable if catch viewable"
    ON catch_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM catches
            WHERE id = catch_id
            AND (
                (visibility = 'public' AND deleted_at IS NULL)
                OR (visibility = 'followers' AND deleted_at IS NULL AND (
                    auth.uid() = catches.user_id
                    OR EXISTS (SELECT 1 FROM profile_follows
                               WHERE follower_id = auth.uid()
                               AND following_id = catches.user_id)
                ))
                OR (visibility = 'private' AND auth.uid() = catches.user_id AND deleted_at IS NULL)
                OR auth.uid() = catches.user_id
            )
        )
    );

CREATE POLICY "Users can insert reactions on viewable catches"
    ON catch_reactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM catches
            WHERE id = catch_id
            AND deleted_at IS NULL
            AND (
                visibility = 'public'
                OR (visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM profile_follows
                    WHERE follower_id = auth.uid() AND following_id = catches.user_id
                ))
                OR auth.uid() = catches.user_id
            )
        )
    );

CREATE POLICY "Users can delete own reactions"
    ON catch_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- ON DELETE behavior:
-- - From catches: CASCADE (remove reactions with parent catch)
-- - From users: CASCADE (remove all user's reactions)
```

**Key Design Decisions:**
- Composite PK prevents duplicate reactions
- Users can change reaction (UPDATE) or remove (DELETE)
- No soft delete (reactions are ephemeral)
- Visibility inherits from parent catch

### 11. ratings

**Purpose:** Numerical ratings (1-10) on catches

```sql
CREATE TABLE ratings (
    catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (catch_id, user_id),  -- One rating per user per catch
    CONSTRAINT rating_range CHECK (rating BETWEEN 1 AND 10)
);

-- Indexes
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_created ON ratings(created_at DESC);

-- RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable if catch viewable"
    ON ratings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM catches
            WHERE id = catch_id
            AND allow_ratings = true
            AND (
                (visibility = 'public' AND deleted_at IS NULL)
                OR (visibility = 'followers' AND deleted_at IS NULL AND (
                    auth.uid() = catches.user_id
                    OR EXISTS (SELECT 1 FROM profile_follows
                               WHERE follower_id = auth.uid()
                               AND following_id = catches.user_id)
                ))
                OR (visibility = 'private' AND auth.uid() = catches.user_id AND deleted_at IS NULL)
                OR auth.uid() = catches.user_id
            )
        )
    );

CREATE POLICY "Users can insert ratings on ratable catches"
    ON ratings FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND auth.uid() <> (SELECT user_id FROM catches WHERE id = catch_id)  -- Can't rate own
        AND EXISTS (
            SELECT 1 FROM catches
            WHERE id = catch_id
            AND deleted_at IS NULL
            AND allow_ratings = true
            AND (
                visibility = 'public'
                OR (visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM profile_follows
                    WHERE follower_id = auth.uid() AND following_id = catches.user_id
                ))
            )
        )
    );

CREATE POLICY "Users can update own ratings"
    ON ratings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
    ON ratings FOR DELETE
    USING (auth.uid() = user_id);

-- ON DELETE behavior:
-- - From catches: CASCADE (remove ratings with parent catch)
-- - From users: CASCADE (remove all user's ratings)
```

**Key Design Decisions:**
- Cannot rate own catches (enforced in INSERT policy)
- Cannot rate private catches (even if follower)
- Catch owner can disable ratings via `allow_ratings` flag
- Users can update or delete their rating

### 12. profile_follows

**Purpose:** User following relationships

```sql
CREATE TABLE profile_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Indexes
CREATE INDEX idx_profile_follows_follower ON profile_follows(follower_id);
CREATE INDEX idx_profile_follows_following ON profile_follows(following_id);

-- RLS
ALTER TABLE profile_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
    ON profile_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON profile_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON profile_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- ON DELETE behavior:
-- - From users: CASCADE (remove follow relationships when user deleted)
```

**Key Design Decisions:**
- Publicly visible (enables social graph features)
- No approval required (one-way follow model like Twitter)
- Self-follow prevented via CHECK constraint
- Used by catches RLS to determine "followers" visibility

---

## Notification & Moderation

### 13. notifications

**Purpose:** User notifications for all activity

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    message TEXT NOT NULL,

    -- Optional references
    catch_id UUID REFERENCES catches(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES catch_comments(id) ON DELETE CASCADE,

    -- Extra data (JSONB for extensibility)
    extra_data JSONB DEFAULT '{}'::jsonb,

    -- Read status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read)
    WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ON DELETE behavior:
-- - From user_id: CASCADE (remove notifications when user deleted)
-- - From actor_id: SET NULL (preserve notification even if actor deleted)
-- - From catch_id: CASCADE (remove notification if catch deleted)
-- - From comment_id: CASCADE (remove notification if comment deleted)
```

**Key Design Decisions:**
- `actor_id` tracks who triggered the notification
- Optional FK references to catch/comment for deep linking
- `extra_data` JSONB for custom fields (e.g., warning details)
- Unread index for efficient notification badge queries
- Deduplication handled by `create_notification()` RPC function

### 14. reports

**Purpose:** Content reporting system

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    target_type report_target_type NOT NULL,
    target_id UUID NOT NULL,                        -- ID of catch/comment/profile
    reason TEXT NOT NULL,

    -- Status tracking
    status report_status NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    notes TEXT,                                     -- Admin notes

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT reason_not_empty CHECK (length(trim(reason)) > 0)
);

-- Indexes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Admin policies handled via service role or admin RPC functions

-- Triggers
-- Rate limiting (max 5 reports per hour)

-- ON DELETE behavior:
-- - From reporter: CASCADE (remove reports when user deleted)
-- - From resolver: SET NULL (preserve report even if admin deleted)
```

**Key Design Decisions:**
- Polymorphic target (catch/comment/profile)
- Status workflow: open → in_review → resolved/dismissed
- Users can only see their own reports (admins use service role)
- No soft delete (reports are permanent record)

### 15. admin_users

**Purpose:** Admin registry (service role bypass)

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin list viewable by admins only"
    ON admin_users FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ON DELETE behavior:
-- - From users: CASCADE (remove admin status when user deleted)
```

**Key Design Decisions:**
- Simple registry (no roles/permissions for MVP)
- Self-referential RLS (admins can see admin list)
- Admin RPCs check this table via `SECURITY DEFINER`

### 16. user_warnings

**Purpose:** Warning history for moderation

```sql
CREATE TABLE user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    issued_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    severity warning_severity NOT NULL,
    reason TEXT NOT NULL,

    -- Duration (for temporary suspensions)
    duration_hours INTEGER,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT reason_not_empty CHECK (length(trim(reason)) > 0),
    CONSTRAINT duration_positive CHECK (duration_hours IS NULL OR duration_hours > 0)
);

-- Indexes
CREATE INDEX idx_user_warnings_user ON user_warnings(user_id);
CREATE INDEX idx_user_warnings_created ON user_warnings(created_at DESC);

-- RLS
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warnings"
    ON user_warnings FOR SELECT
    USING (auth.uid() = user_id);

-- ON DELETE behavior:
-- - From user: CASCADE (remove warnings when user deleted)
-- - From issuer: SET NULL (preserve warning even if admin deleted)
```

**Key Design Decisions:**
- Permanent record (no soft delete)
- Users can see their own warning history
- Severity levels: warning → suspension → ban
- Automatic expiry tracking for temporary suspensions

### 17. moderation_log

**Purpose:** Audit log for all moderation actions

```sql
CREATE TABLE moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    action mod_action NOT NULL,
    target_type report_target_type NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_moderation_log_target ON moderation_log(target_type, target_id);
CREATE INDEX idx_moderation_log_admin ON moderation_log(admin_id);
CREATE INDEX idx_moderation_log_created ON moderation_log(created_at DESC);

-- RLS
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view (via service role or admin RPC)

-- ON DELETE behavior:
-- - From admin: SET NULL (preserve log even if admin deleted)
```

**Key Design Decisions:**
- Append-only log (no updates/deletes)
- JSONB details for action-specific data
- Admin-only access (enforced via service role)
- Tracks all admin actions for accountability

---

## System Tables

### 18. rate_limits

**Purpose:** Database-driven rate limiting

```sql
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,                           -- e.g., 'catch_creation', 'comment_creation'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action, created_at);
CREATE INDEX idx_rate_limits_created ON rate_limits(created_at);

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits managed by RPC functions, not directly accessible

-- Cleanup
-- Run cleanup_rate_limits() every 2 hours (via cron)
-- Deletes records older than 2 hours

-- ON DELETE behavior:
-- - From users: CASCADE (remove rate limit records when user deleted)
```

**Key Design Decisions:**
- Simple time-based records (no complex counters)
- Cleaned up automatically (2 hour retention)
- Enforced via triggers on catches/comments/reports
- Limits: 10 catches/hr, 30 comments/hr, 5 reports/hr

---

## Views & Materialized Views

### leaderboard_scores_detailed (View)

**Purpose:** Real-time leaderboard with scores

```sql
CREATE OR REPLACE VIEW leaderboard_scores_detailed AS
SELECT
    c.id,
    c.user_id,
    c.title,
    c.description,
    c.species_slug,
    c.custom_species,
    c.weight,
    c.weight_unit,
    c.length,
    c.length_unit,
    c.image_url,
    c.gallery_photos,
    c.video_url,
    c.location_label,
    c.normalized_location,
    c.water_type_code,
    c.method_tag,
    c.tags,
    c.time_of_day,
    c.caught_at,
    c.conditions,
    c.created_at,
    c.visibility,

    -- Profile details
    p.username AS owner_username,
    p.avatar_path AS owner_avatar_path,
    p.avatar_url AS owner_avatar_url,

    -- Aggregates
    COALESCE(AVG(r.rating), 0)::NUMERIC(4,2) AS avg_rating,
    COUNT(DISTINCT r.user_id)::INTEGER AS rating_count,
    COUNT(DISTINCT cr.user_id)::INTEGER AS reaction_count,

    -- Scoring formula: weight + (avg_rating * 5) + (reaction_count * 0.5)
    (
        COALESCE(c.weight, 0) +
        (COALESCE(AVG(r.rating), 0) * 5) +
        (COUNT(DISTINCT cr.user_id) * 0.5)
    )::NUMERIC(10,2) AS total_score

FROM catches c
LEFT JOIN ratings r ON r.catch_id = c.id
LEFT JOIN catch_reactions cr ON cr.catch_id = c.id
LEFT JOIN profiles p ON p.user_id = c.user_id
WHERE c.visibility = 'public' AND c.deleted_at IS NULL
GROUP BY c.id, p.username, p.avatar_path, p.avatar_url;
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

-- Top catches by weight
SELECT * FROM leaderboard_scores_detailed
WHERE species_slug = 'pike'
ORDER BY weight DESC LIMIT 10;
```

### leaderboard_scores_mv (Materialized View)

**Purpose:** Cached leaderboard for performance

```sql
CREATE MATERIALIZED VIEW leaderboard_scores_mv AS
SELECT * FROM leaderboard_scores_detailed;

-- Indexes
CREATE UNIQUE INDEX idx_leaderboard_mv_id ON leaderboard_scores_mv(id);
CREATE INDEX idx_leaderboard_mv_species ON leaderboard_scores_mv(species_slug);
CREATE INDEX idx_leaderboard_mv_score ON leaderboard_scores_mv(total_score DESC);
CREATE INDEX idx_leaderboard_mv_weight ON leaderboard_scores_mv(weight DESC);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_scores_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Refresh Strategy:**
```sql
-- Manual refresh
SELECT refresh_leaderboard();

-- Automated via cron (daily at 2am)
SELECT cron.schedule(
    'refresh-leaderboard',
    '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_scores_mv'
);
```

**Key Design Decisions:**
- **View** for real-time data (small apps, always current)
- **Materialized view** for performance (large apps, refresh daily/hourly)
- Use `CONCURRENTLY` to avoid locking during refresh
- Score formula weights: weight (1x) + rating (5x) + reactions (0.5x)

---

## Normalization Strategy

### Normalization vs Denormalization Decisions

| Field | Normalized | Denormalized | Rationale |
|-------|-----------|--------------|-----------|
| **Species** | `catches.species_id` → `species.id` | `catches.species_slug` | Slug enables fast filtering without JOIN; ID maintains integrity |
| **Venue** | `catches.venue_id` → `venues.id` | `catches.location_label` | Label for display; ID for filtering/analytics |
| **Location** | `catches.location_label` | `catches.normalized_location` | Normalized copy enables case-insensitive search |
| **User** | `catches.user_id` → `profiles.user_id` | *(Joined in views)* | Always JOIN for username/avatar; no denormalization |
| **Ratings** | `ratings` table | `avg_rating` in view | Computed on-the-fly; cached in materialized view |

### Rationale

**Why denormalize `species_slug`?**
- Leaderboard queries need to filter by species efficiently
- Joining species table for every query adds overhead
- Slug is stable (rarely changes)
- Slug is small (text, not UUID)
- Trade-off: 10-20 bytes per catch vs JOIN on every query

**Why denormalize `location_label`?**
- Most catches use manual location, not venue FK
- Display requires location string
- Normalization would require COALESCE(venue.name, location_manual)
- Location is stable after catch creation

**Why NOT denormalize username/avatar?**
- Usernames/avatars change frequently
- Denormalization would require cascading updates
- Profile JOINs are fast (indexed, 1:1 relationship)
- Feed/leaderboard views already aggregate data

**Why normalize ratings/reactions?**
- Aggregates change constantly
- Multiple users contribute
- AVG/COUNT cannot be denormalized efficiently
- Materialized view provides caching layer

---

## Deletion Rules

### Hard Delete (CASCADE)

**profiles → catches/sessions/comments/reactions/ratings**
- **Trigger:** User account deletion (GDPR right to be forgotten)
- **Behavior:** All user content removed completely
- **Rationale:** User privacy takes precedence over historical data

**catches → comments/reactions/ratings**
- **Trigger:** Catch hard delete (admin action or user account deletion)
- **Behavior:** All engagement data removed with parent
- **Rationale:** Comments/ratings without parent catch are meaningless

### Soft Delete (deleted_at)

**catches**
- **Trigger:** User deletes own catch
- **Behavior:** `deleted_at = NOW()`, hidden from feeds/leaderboards
- **Rationale:**
  - Preserves session integrity (sessions reference catches)
  - Enables "undo" functionality
  - Maintains historical statistics
  - Supports moderation review
- **Cleanup:** Optional cron job to hard delete after 30 days

**sessions**
- **Trigger:** User deletes session
- **Behavior:** `deleted_at = NOW()`, hidden from session list
- **Rationale:**
  - Preserves catch records (catches reference sessions via SET NULL)
  - User may want to recover session
  - Historical trip data valuable for analytics
- **Cleanup:** Optional cron job to hard delete after 90 days

**catch_comments**
- **Trigger:** User or admin deletes comment
- **Behavior:** `deleted_at = NOW()`, hidden from UI
- **Rationale:**
  - Admin moderation needs to review deleted content
  - Preserves conversation context (reply chains)
  - May contain policy violations (evidence)
- **Cleanup:** Optional cron job to hard delete after 30 days

### SET NULL (Preserve Child Records)

**venues → catches/sessions**
- **Trigger:** Venue removed from catalog
- **Behavior:** FK set to NULL, manual name preserved
- **Rationale:** Catches/sessions still valid without venue catalog entry

**species → catches**
- **Trigger:** Species removed from catalog
- **Behavior:** FK set to NULL, custom name preserved
- **Rationale:** Catches still valid without species catalog entry

**sessions → catches**
- **Trigger:** Session deleted (soft or hard)
- **Behavior:** FK set to NULL, catch remains
- **Rationale:** Catch is standalone record; session is optional grouping

**actor_id (notifications/warnings/logs) → profiles**
- **Trigger:** Admin/actor account deleted
- **Behavior:** FK set to NULL, record preserved
- **Rationale:** Audit trail must remain even if actor deleted

### Deletion Decision Matrix

| Entity | User Deletes | Admin Deletes | User Account Deleted |
|--------|-------------|---------------|---------------------|
| **Profile** | N/A | Hard delete (CASCADE) | Hard delete (CASCADE) |
| **Catch** | Soft delete | Soft delete | Hard delete (CASCADE) |
| **Session** | Soft delete | Soft delete | Hard delete (CASCADE) |
| **Comment** | Soft delete | Soft delete | Hard delete (CASCADE) |
| **Reaction** | Hard delete | Hard delete | Hard delete (CASCADE) |
| **Rating** | Hard delete | Hard delete | Hard delete (CASCADE) |
| **Follow** | Hard delete | Hard delete | Hard delete (CASCADE) |
| **Notification** | Mark read | N/A | Hard delete (CASCADE) |
| **Report** | N/A | Update status | Hard delete (CASCADE) |

---

## Performance Considerations

### Indexing Strategy

**1. Primary Keys (Automatic)**
- All tables have UUID primary keys
- Automatic B-tree index created

**2. Foreign Keys (Manual)**
- All FK columns indexed for JOIN performance
- Example: `idx_catches_user ON catches(user_id)`

**3. Filter Columns**
- Frequently filtered columns get indexes
- Example: `idx_catches_visibility`, `idx_catches_species_slug`

**4. Sort Columns**
- Created_at DESC for feeds
- Total_score DESC for leaderboards

**5. Partial Indexes**
- `idx_catches_deleted ON catches(deleted_at)` - sparse, only non-NULL
- `idx_notifications_unread` - WHERE is_read = false

**6. Composite Indexes**
- `idx_rate_limits_user_action` - (user_id, action, created_at)
- Supports windowed rate limit queries

### Query Optimization

**Feed Query (Following)**
```sql
-- Efficient with indexes
SELECT c.* FROM catches c
WHERE c.user_id IN (
    SELECT following_id FROM profile_follows WHERE follower_id = ?
)
AND c.visibility IN ('public', 'followers')
AND c.deleted_at IS NULL
ORDER BY c.created_at DESC
LIMIT 20;

-- Uses: idx_catches_user, idx_catches_visibility, idx_catches_created
```

**Leaderboard Query**
```sql
-- Use materialized view for best performance
SELECT * FROM leaderboard_scores_mv
WHERE species_slug = 'mirror_carp'
ORDER BY total_score DESC
LIMIT 10;

-- Uses: idx_leaderboard_mv_species, idx_leaderboard_mv_score
```

**Search Query (Location)**
```sql
-- Case-insensitive search
SELECT c.* FROM catches c
WHERE c.normalized_location LIKE '%oxford%'
AND c.visibility = 'public'
AND c.deleted_at IS NULL
ORDER BY c.caught_at DESC;

-- Uses: idx_catches_location, idx_catches_visibility
```

### Caching Strategy

**1. Materialized Views**
- Leaderboard: Refresh daily/hourly
- Avoids expensive aggregations on every request

**2. Application-Level Caching**
- User profiles (Redis, 5 min TTL)
- Species/venue catalogs (Redis, 1 hour TTL)
- Lookup tables (In-memory, refresh on deploy)

**3. CDN Caching**
- Public catch images (CloudFront, 1 year)
- User avatars (CloudFront, 1 day)

### Scalability Considerations

**Current Schema Limits:**
- 1M catches: No issues (indexed queries remain fast)
- 100K users: No issues (profile JOINs efficient)
- 10M ratings: Consider partitioning by month

**Future Optimizations:**
- Partition catches table by year (when > 5M rows)
- Partition rate_limits by day (when > 10M rows)
- Add full-text search indexes (pg_trgm) for description search
- Consider read replicas for leaderboard queries

---

## Summary

This schema provides:

1. **Complete Feature Support**
   - All required features implemented
   - Extensible for future enhancements

2. **Consistent Naming**
   - `*_slug`, `*_label`, `*_code`, `*_tag` pattern
   - Clear distinction between FK IDs and denormalized fields

3. **Proper Deletion Handling**
   - Soft delete for user-initiated actions (undo support)
   - Hard delete for GDPR compliance (user account deletion)
   - SET NULL for catalog references (preserve historical data)

4. **Performance Optimized**
   - Strategic denormalization (species_slug, normalized_location)
   - Comprehensive indexing (PKs, FKs, filters, sorts)
   - Materialized views for expensive aggregations

5. **Security First**
   - RLS policies on all tables
   - Visibility-aware access control
   - Admin actions via SECURITY DEFINER RPCs
   - Rate limiting enforced at DB level

6. **Maintainable**
   - Clear table purposes
   - Documented design decisions
   - Consistent patterns across tables
   - Extensible via JSONB fields

This schema is **production-ready** for an MVP fishing app and scales to support growth.
