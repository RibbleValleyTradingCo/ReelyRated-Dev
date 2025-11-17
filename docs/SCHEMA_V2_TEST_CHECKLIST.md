**Completed!** I've created a comprehensive, production-ready database schema rebuild for ReelyRated. Here's what has been delivered:

---

## 📦 DELIVERABLES

### 1. **Complete SQL Schema** (3 files)
- `supabase/migrations/20251115_v2_complete_schema.sql` - All tables, views, indexes, RLS policies, triggers
- `supabase/migrations/20251115_v2_rpc_functions.sql` - All RPC functions (auth, notifications, admin, rate limiting)
- `supabase/seed-v2.sql` - Test data with profiles, species, venues, sessions, catches

### 2. **Documentation** (3 files)
- `docs/SCHEMA_V2_TYPESCRIPT_TYPES.md` - Complete TypeScript type definitions
- `docs/SCHEMA_V2_QUERY_MAPPINGS.md` - Migration guide showing OLD vs NEW queries
- `docs/SCHEMA_V2_TEST_CHECKLIST.md` - Manual testing checklist (this file)

---

## ✅ MANUAL TEST CHECKLIST

### Prerequisites
- [ ] Auth users exist in `auth.users` (mike@test.com, sarah@test.com, tom@test.com)
- [ ] Run schema migration: `20251115_v2_complete_schema.sql`
- [ ] Run RPC functions: `20251115_v2_rpc_functions.sql`
- [ ] Run seed data: `seed-v2.sql`
- [ ] Refresh materialized view: `REFRESH MATERIALIZED VIEW leaderboard_scores_mv;`

---

### 1. AUTH & PROFILE FLOW

**Test: Sign up new user**
- [ ] Sign up with new email
- [ ] Profile auto-created via `handle_new_user()` trigger
- [ ] Username generated from email (lowercase, no special chars)
- [ ] Full name set to email local part
- [ ] Verify in DB: `SELECT * FROM profiles WHERE user_id = '<new-user-id>';`

**Test: View profile**
- [ ] Navigate to `/profile/mike`
- [ ] Profile loads with username, bio, location, avatar
- [ ] Shows total catches, followers count
- [ ] Shows user's catches grid

**Test: Edit profile**
- [ ] Click "Edit Profile" or "Status" button
- [ ] Update bio, full_name, location, website
- [ ] Save changes
- [ ] Verify `updated_at` timestamp changed
- [ ] Check: `SELECT bio, full_name, updated_at FROM profiles WHERE username = 'mike';`

---

### 2. SESSIONS & CATCHES

**Test: Create session**
- [ ] Navigate to Sessions page
- [ ] Click "Add Session"
- [ ] Fill in: title, date, venue (select from dropdown OR manual text), notes
- [ ] Save session
- [ ] Verify appears in sessions list
- [ ] Check: `SELECT * FROM sessions WHERE user_id = auth.uid();`

**Test: Add catch (with session link)**
- [ ] Navigate to "Add Catch" page
- [ ] Fill required fields:
  - Upload image
  - Title
  - Select session (dropdown of user's sessions)
  - Select species (dropdown from species table) OR enter custom species
  - Weight & unit
  - Location (manual OR select venue from dropdown)
- [ ] Fill optional fields: description, length, bait, method, time of day, weather conditions
- [ ] Set visibility: public, followers, private
- [ ] Save catch
- [ ] Verify catch appears in feed (if public)
- [ ] Check: `SELECT * FROM catches WHERE id = '<catch-id>';`
- [ ] Verify `species_id` and `species_slug` populated correctly
- [ ] Verify `normalized_location` set via trigger

**Test: Add catch (standalone, no session)**
- [ ] Add catch without selecting a session
- [ ] Verify `session_id` is NULL
- [ ] Catch still shows correctly in feed

**Test: Soft delete catch**
- [ ] As catch owner, click "Delete" on catch
- [ ] Confirm deletion
- [ ] Catch disappears from feed
- [ ] Check: `SELECT deleted_at FROM catches WHERE id = '<catch-id>';` (should be timestamp, not NULL)
- [ ] Verify catch no longer appears in: feed, search, profile, venue pages, insights

---

### 3. FEED (GLOBAL & FOLLOWING)

**Test: Global feed**
- [ ] Navigate to `/feed`
- [ ] See all public catches ordered by `created_at` DESC
- [ ] Each catch shows:
  - Image
  - Title
  - Species name (from species table join)
  - Weight
  - Owner username & avatar
  - Location
  - Rating count & average
  - Comment count
  - Reaction count
- [ ] Verify soft-deleted catches NOT shown
- [ ] Verify private catches NOT shown (unless you're the owner)
- [ ] Check query: `SELECT * FROM catches WHERE visibility = 'public' AND deleted_at IS NULL;`

**Test: Following feed**
- [ ] Follow another user (e.g., Mike follows Sarah)
- [ ] Switch to "Following" tab on feed
- [ ] See only catches from users you follow
- [ ] Verify catches with `visibility = 'followers'` are visible
- [ ] Unfollow user → their catches disappear from following feed

**Test: Feed filters**
- [ ] Filter by species (select "Mirror Carp")
- [ ] Only mirror carp catches shown
- [ ] Filter by location (type "Linear")
- [ ] Only catches from Linear Fisheries shown
- [ ] Clear filters → all catches shown again

---

### 4. SEARCH

**Test: Profile search**
- [ ] Navigate to `/search`
- [ ] Search for "mike"
- [ ] Mike's profile appears
- [ ] Search for partial bio text → relevant profiles shown
- [ ] Search for location → profiles with that location shown

**Test: Catch search**
- [ ] Search for species name (e.g., "pike")
- [ ] All pike catches shown
- [ ] Search for location (e.g., "Linear")
- [ ] All catches from Linear shown
- [ ] Search for custom species → catches with that custom_species shown

**Test: Venue search**
- [ ] Search for "Linear Fisheries"
- [ ] Venue appears in results with catch count
- [ ] Click venue → navigate to venue detail page

---

### 5. VENUE DETAIL PAGES

**Test: View venue page**
- [ ] Navigate to `/venue/linear-fisheries` (or click venue from search)
- [ ] Venue name, region, country, description shown
- [ ] Map with coordinates displayed (if lat/lng exist)
- [ ] List of all PUBLIC catches from this venue
- [ ] Catches sorted by total_score or created_at
- [ ] Check query: `SELECT * FROM catches WHERE venue_id = '<venue-id>' AND visibility = 'public' AND deleted_at IS NULL;`

---

### 6. LEADERBOARDS

**Test: Overall leaderboard**
- [ ] Navigate to `/leaderboard`
- [ ] Top 100 catches shown, ordered by `total_score` DESC
- [ ] Each entry shows: image, title, species, weight, owner, avg_rating, reaction_count
- [ ] Verify using materialized view: `SELECT * FROM leaderboard_scores_mv ORDER BY total_score DESC LIMIT 100;`

**Test: Species-specific leaderboard**
- [ ] Filter leaderboard by species (e.g., "Mirror Carp")
- [ ] Only mirror carp catches shown
- [ ] Ordered by total_score DESC
- [ ] Check: `SELECT * FROM leaderboard_scores_mv WHERE species_slug = 'mirror_carp' ORDER BY total_score DESC;`

**Test: Hero spotlight**
- [ ] Hero component on homepage shows top catch
- [ ] Query: `SELECT * FROM leaderboard_scores_mv ORDER BY total_score DESC LIMIT 1;`
- [ ] Verify correct catch displayed with all details

**Test: Realtime leaderboard updates**
- [ ] Open leaderboard page
- [ ] In another tab, add rating to a catch
- [ ] Leaderboard updates in realtime (via Supabase channels)
- [ ] Position and avg_rating change reflect immediately

---

### 7. INSIGHTS/ANALYTICS

**Test: View insights page**
- [ ] Navigate to `/insights`
- [ ] See charts/tables for:
  - **Catches over time** (by month or custom date range)
  - **Breakdown by venue** (pie chart or table)
  - **Breakdown by species** (pie chart or table)
  - **Time of day performance** (morning vs afternoon vs evening vs night)
- [ ] Verify data matches: `SELECT * FROM catches WHERE user_id = auth.uid() AND deleted_at IS NULL;`

**Test: Date range filter**
- [ ] Select date range (e.g., last 3 months)
- [ ] Insights update to only show catches in that range
- [ ] Check: `SELECT * FROM catches WHERE user_id = auth.uid() AND caught_at BETWEEN '2024-08-01' AND '2024-11-01';`

---

### 8. NOTIFICATIONS

**Test: Follow notification**
- [ ] User A follows User B
- [ ] User B receives notification: "User A started following you"
- [ ] Type: `new_follower`
- [ ] Check: `SELECT * FROM notifications WHERE user_id = '<user-b-id>' AND type = 'new_follower';`

**Test: Comment notification**
- [ ] User A comments on User B's catch
- [ ] User B receives notification: "User A commented on your catch"
- [ ] Type: `new_comment`
- [ ] Clicking notification navigates to catch detail page

**Test: Rating notification**
- [ ] User A rates User B's catch
- [ ] User B receives notification: "User A rated your catch"
- [ ] Type: `new_rating`

**Test: Reaction notification**
- [ ] User A reacts (like/love/fire) to User B's catch
- [ ] User B receives notification: "User A reacted to your catch"
- [ ] Type: `new_reaction`

**Test: @Mention notification**
- [ ] User A comments: "Great catch @mike!"
- [ ] Mike receives notification: "User A mentioned you"
- [ ] Type: `mention`
- [ ] Check: `mentioned_usernames` array in comment contains `['mike']`

**Test: Mark as read**
- [ ] Click on unread notification
- [ ] Notification marked as read (`is_read = true`, `read_at` set)
- [ ] Unread badge count decreases

**Test: Notification deduplication**
- [ ] User A follows User B twice within 5 minutes (somehow)
- [ ] Only 1 notification created (dedup logic in `create_notification` RPC)
- [ ] Check: `SELECT COUNT(*) FROM notifications WHERE user_id = '<user-b-id>' AND type = 'new_follower' AND actor_id = '<user-a-id>';` (should be 1)

---

### 9. REPORTS & MODERATION

**Test: File report (as user)**
- [ ] View a catch/comment/profile
- [ ] Click "Report" button
- [ ] Fill reason: "Inappropriate content"
- [ ] Submit report
- [ ] Report created with status = 'open'
- [ ] Check: `SELECT * FROM reports WHERE reporter_id = auth.uid();`

**Test: View reports (as admin)**
- [ ] Navigate to `/admin/reports`
- [ ] See all reports with status = 'open'
- [ ] Each report shows: target type, target ID, reporter username, reason, created_at

**Test: Admin delete catch**
- [ ] As admin, click "Delete" on reported catch
- [ ] Confirm deletion with reason
- [ ] RPC called: `admin_delete_catch(catch_id, reason)`
- [ ] Check:
  - `SELECT deleted_at FROM catches WHERE id = '<catch-id>';` (timestamp set)
  - `SELECT * FROM moderation_log WHERE target_id = '<catch-id>' AND action = 'delete_catch';` (logged)
  - `SELECT * FROM notifications WHERE catch_id = '<catch-id>' AND type = 'admin_warning';` (owner notified)

**Test: Admin restore catch**
- [ ] As admin, click "Restore" on soft-deleted catch
- [ ] RPC called: `admin_restore_catch(catch_id, reason)`
- [ ] Check:
  - `SELECT deleted_at FROM catches WHERE id = '<catch-id>';` (NULL again)
  - Catch reappears in feed
  - Moderation log entry created
  - Owner notified

**Test: Admin delete comment**
- [ ] As admin, soft-delete inappropriate comment
- [ ] RPC: `admin_delete_comment(comment_id, reason)`
- [ ] Comment disappears from catch detail page
- [ ] Check: `SELECT deleted_at FROM catch_comments WHERE id = '<comment-id>';`

**Test: Admin warn user**
- [ ] As admin, issue warning to user
- [ ] RPC: `admin_warn_user(user_id, reason, severity, duration_hours)`
- [ ] Severity options: 'warning', 'temporary_suspension', 'permanent_ban'
- [ ] Check:
  - `SELECT * FROM user_warnings WHERE user_id = '<user-id>';` (warning created)
  - `SELECT warn_count, moderation_status FROM profiles WHERE user_id = '<user-id>';` (incremented, status updated)
  - `SELECT * FROM moderation_log WHERE action = 'warn_user';` (logged)
  - User receives notification

**Test: Temporary suspension**
- [ ] Admin warns user with severity = 'temporary_suspension', duration = 24 hours
- [ ] User's `moderation_status` = 'suspended'
- [ ] User's `suspension_until` = NOW() + 24 hours
- [ ] After 24 hours, suspension expires (implement cron job or check on login)

---

### 10. RATE LIMITING

**Test: Catch creation rate limit (10 per hour)**
- [ ] Sign in as user
- [ ] Create 10 catches rapidly
- [ ] All 10 succeed
- [ ] Attempt to create 11th catch
- [ ] Error: "Rate limit exceeded: Maximum 10 catches per hour"
- [ ] Check: `SELECT COUNT(*) FROM rate_limits WHERE user_id = auth.uid() AND action = 'catch_creation' AND created_at > NOW() - INTERVAL '1 hour';` (should be 10)

**Test: Comment rate limit (30 per hour)**
- [ ] Create 30 comments on various catches
- [ ] Attempt 31st comment
- [ ] Error: "Rate limit exceeded: Maximum 30 comments per hour"

**Test: Report rate limit (5 per hour)**
- [ ] File 5 reports
- [ ] Attempt 6th report
- [ ] Error: "Rate limit exceeded: Maximum 5 reports per hour"

**Test: Rate limit status RPC**
- [ ] Call: `get_rate_limit_status(user_id, 'catch_creation', 10, 60)`
- [ ] Returns: `{ allowed: 10, used: 7, remaining: 3, reset_at: '2024-11-15T16:30:00Z' }`
- [ ] Display to user: "You have 3 catches remaining. Resets at 4:30 PM"

**Test: Rate limit cleanup**
- [ ] Wait 2+ hours
- [ ] Call: `cleanup_rate_limits()`
- [ ] Old rate_limits records (>2 hours) deleted
- [ ] Check: `SELECT COUNT(*) FROM rate_limits WHERE created_at < NOW() - INTERVAL '2 hours';` (should be 0)

---

### 11. SOCIAL INTERACTIONS

**Test: Add reaction**
- [ ] View catch detail page
- [ ] Click "Like" button → reaction added
- [ ] Click "Love" button → reaction changed to 'love'
- [ ] Click "Fire" button → reaction changed to 'fire'
- [ ] Click reaction again → reaction removed
- [ ] Check: `SELECT reaction FROM catch_reactions WHERE catch_id = '<catch-id>' AND user_id = auth.uid();`

**Test: Add comment**
- [ ] View catch detail page
- [ ] Write comment: "Great catch!"
- [ ] Submit
- [ ] Comment appears instantly
- [ ] Catch owner receives notification
- [ ] Check: `SELECT * FROM catch_comments WHERE catch_id = '<catch-id>' AND user_id = auth.uid();`

**Test: @Mention in comment**
- [ ] Write comment: "Nice one @sarah!"
- [ ] Submit
- [ ] Sarah receives 'mention' notification
- [ ] Check: `SELECT mentioned_usernames FROM catch_comments WHERE id = '<comment-id>';` (contains ['sarah'])

**Test: Add rating**
- [ ] View catch detail page (not your own catch)
- [ ] Rate catch: 9/10
- [ ] Rating saved
- [ ] Average rating updates
- [ ] Catch owner receives notification
- [ ] Check: `SELECT rating FROM ratings WHERE catch_id = '<catch-id>' AND user_id = auth.uid();`

**Test: Update rating**
- [ ] Change rating from 9 to 10
- [ ] Rating updated (not duplicated)
- [ ] Average rating recalculates

**Test: Cannot rate own catch**
- [ ] Try to rate your own catch
- [ ] Error or button disabled
- [ ] RLS policy prevents: `auth.uid() <> (SELECT user_id FROM catches WHERE id = catch_id)`

---

### 12. PRIVACY & VISIBILITY

**Test: Public catch visibility**
- [ ] Create catch with visibility = 'public'
- [ ] Signed-in users see it in feed
- [ ] Guests see it in feed (if guest access enabled)
- [ ] Appears on profile page
- [ ] Appears on venue page
- [ ] Appears in search
- [ ] Appears in leaderboard

**Test: Followers-only catch visibility**
- [ ] User A creates catch with visibility = 'followers'
- [ ] User B (who follows A) sees it in feed
- [ ] User C (who doesn't follow A) does NOT see it
- [ ] Appears on User A's own profile
- [ ] Does NOT appear in global feed for non-followers
- [ ] Does NOT appear in leaderboard

**Test: Private catch visibility**
- [ ] User A creates catch with visibility = 'private'
- [ ] Only User A can see it
- [ ] Does NOT appear in any feed (even following)
- [ ] Does NOT appear on profile page (except for owner)
- [ ] Does NOT appear in search
- [ ] Does NOT appear in leaderboard

**Test: Hide exact spot**
- [ ] Create catch with `hide_exact_spot = true`
- [ ] Location shown as "Undisclosed venue" for other users
- [ ] Owner still sees full location
- [ ] Check in catch card: `shouldShowExactLocation(catch.hide_exact_spot, catch.user_id, currentUserId)`

---

### 13. RLS POLICIES

**Test: Profile RLS**
- [ ] All users can view all profiles (SELECT policy)
- [ ] Users can only update their own profile (UPDATE policy)
- [ ] Check: Try to update another user's profile via SQL → denied

**Test: Catch RLS**
- [ ] Public catches visible to everyone
- [ ] Followers catches visible to followers + owner
- [ ] Private catches visible to owner only
- [ ] Owner can always see own catches (even soft-deleted)
- [ ] Admins can see all via service role (not regular RLS)

**Test: Comment RLS**
- [ ] Comments visible if parent catch visible
- [ ] Users can comment on public catches
- [ ] Users can comment on followers catches (if they follow owner)
- [ ] Users cannot comment on private catches (unless they're the owner)

**Test: Reaction/Rating RLS**
- [ ] Similar to comments - tied to catch visibility
- [ ] Cannot rate own catch
- [ ] Cannot rate catch with `allow_ratings = false`

---

## 🔍 ASSUMPTIONS

### Database Design Assumptions

1. **User ID Source**: `auth.users.id` is the canonical user ID (managed by Supabase Auth)
2. **Soft Delete**: Catches, sessions, and comments use `deleted_at` for soft delete (not hard DELETE)
3. **Species Catalog**: Species are pre-populated in `species` table, but users can use `custom_species` for unlisted species
4. **Venue Catalog**: Venues are pre-populated, but users can use `venue_name_manual` for unlisted venues
5. **Normalization**: Some denormalization is acceptable for performance:
   - `species_slug` stored on catches for fast filtering (in addition to `species_id` FK)
   - `normalized_location` for case-insensitive search
   - `owner_username` in leaderboard view
6. **Rate Limits**: DB-enforced via triggers (10 catches/hour, 30 comments/hour, 5 reports/hour)
7. **Leaderboard Scoring**: Formula is `weight + (avg_rating * 5) + (reaction_count * 0.5)` - this can be tuned
8. **Notifications**: 5-minute deduplication window to prevent spam

### Frontend Assumptions

9. **Column Name Changes**: Frontend must be updated to use `user_id` instead of `id` on profiles
10. **Species Dropdown**: Frontend needs dropdown populated from `species` table
11. **Venue Dropdown**: Frontend needs dropdown populated from `venues` table
12. **Reaction Types**: Frontend UI needs buttons for like/love/fire (not just generic "like")
13. **Rate Limit Display**: Frontend should show "X remaining" using `get_rate_limit_status()` RPC

### Scalability Assumptions

14. **Early-Stage Product**: Not optimized for millions of users yet
15. **Materialized View Refresh**: Leaderboard materialized view needs manual refresh or cron job (not real-time)
16. **Rate Limit Cleanup**: Needs cron job to call `cleanup_rate_limits()` every 2-4 hours
17. **Indexes**: Basic indexes on FKs and common filters - may need tuning as data grows

### Future Extensions

18. **Photo Storage**: Assumes Supabase Storage buckets (`avatars`, `catches`)
19. **Video URLs**: External hosting (YouTube, Vimeo) - stored as URLs, not files
20. **Coordinates**: Venue lat/lng stored but map rendering is frontend responsibility
21. **Weather/Conditions**: Stored as JSONB - extensible for future condition types
22. **Tags**: Method tags stored as TEXT[] - can be normalized to tags table later if needed

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Run schema migration in Supabase SQL Editor
- [ ] Run RPC functions migration
- [ ] Run seed data (or skip if using production data)
- [ ] Grant schema permissions (included in migration)
- [ ] Refresh materialized view: `REFRESH MATERIALIZED VIEW leaderboard_scores_mv;`
- [ ] Set up cron job for rate limit cleanup (optional)
- [ ] Set up cron job for leaderboard refresh (optional, or use regular view)
- [ ] Update frontend TypeScript types
- [ ] Update all Supabase queries per migration guide
- [ ] Test RLS policies in production
- [ ] Test rate limiting in production
- [ ] Monitor performance and add indexes as needed

---

## ❓ KNOWN LIMITATIONS & FUTURE WORK

1. **No full-text search**: Search uses ILIKE (case-insensitive LIKE) - could upgrade to `pg_trgm` or external search engine
2. **No image optimization**: Images stored as URLs - could add thumbnails/compression
3. **No DM system**: Social features don't include direct messaging yet
4. **No badges/achievements**: Gamification not included yet
5. **No export**: Insights data not exportable to CSV/PDF yet
6. **No weather API integration**: Weather conditions manually entered
7. **No catch verification**: No system to verify catch authenticity (photo metadata, GPS, etc.)
8. **No multi-language support**: All text in English
9. **No mobile app**: Web-only for now

---

This schema is production-ready for an early-stage fishing app. It supports all core features, has proper RLS, rate limiting, and admin tools. Future optimizations can be added as needed based on real usage patterns.
