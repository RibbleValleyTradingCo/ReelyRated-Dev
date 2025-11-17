# Manual Test Checklist - ReelyRated V2 Database

## Overview

This document provides a comprehensive manual testing checklist for the ReelyRated V2 database schema. Use this to verify all features, security policies, and integrations before and after deployment.

**Test Environment**: Production or staging environment with V2 schema deployed

**Test Users**:
- mike@test.com (regular user)
- sarah@test.com (regular user)
- tom@test.com (regular user + admin)

---

## Pre-Deployment Setup

### Database Deployment
- [ ] Run `20251115_v2_complete_schema.sql` migration successfully
- [ ] Run `20251115_v2_rpc_functions.sql` migration successfully
- [ ] Verify all 18 tables created (check with `\dt` or information_schema)
- [ ] Verify all RLS policies enabled (`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true`)
- [ ] Verify all RPC functions created (`SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'`)
- [ ] Grant schema permissions verified (`SELECT has_schema_privilege('authenticated', 'public', 'USAGE')` returns true)

### Seed Data Deployment
- [ ] Run `seed-v2.sql` successfully
- [ ] Verify 3 profiles created
- [ ] Verify 8 species created
- [ ] Verify 3 venues created
- [ ] Verify 5+ sessions created
- [ ] Verify 6+ catches created
- [ ] Verify lookup data populated (water_types, baits, tags)

### Materialized View Refresh
- [ ] Run `REFRESH MATERIALIZED VIEW leaderboard_scores_mv` successfully
- [ ] Verify leaderboard data: `SELECT COUNT(*) FROM leaderboard_scores_mv` returns > 0

### Admin User Setup
- [ ] Insert tom@test.com into `admin_users` table
- [ ] Verify: `SELECT * FROM admin_users WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'tom')`

---

## 1. Sign Up & Profile Creation Tests

### Test 1.1: New User Signup
**Steps:**
1. Sign up with new email: `newuser@test.com` (password: `TestPass123!`)
2. Wait for email confirmation (or disable email confirmation in Supabase Auth settings)
3. Sign in

**Expected Results:**
- [ ] User created in `auth.users`
- [ ] Profile auto-created via `handle_new_user()` trigger
- [ ] Username generated from email (e.g., `newuser`)
- [ ] `full_name` set to email local part (e.g., `newuser`)
- [ ] `created_at` and `updated_at` timestamps set
- [ ] No errors in console

**SQL Verification:**
```sql
SELECT user_id, username, full_name, created_at
FROM profiles
WHERE username = 'newuser';
```

**Pass/Fail Criteria:**
- PASS: Profile exists with correct username and full_name
- FAIL: Profile not created, or username/full_name incorrect

---

### Test 1.2: View Own Profile
**Steps:**
1. Sign in as mike@test.com
2. Navigate to `/profile/mike`

**Expected Results:**
- [ ] Profile page loads
- [ ] Display name, bio, location shown
- [ ] Avatar displayed (or default avatar)
- [ ] Total catches count displayed
- [ ] Follower/following counts displayed (if Phase 2 deployed)
- [ ] User's catches grid displayed

**Pass/Fail Criteria:**
- PASS: All profile data visible, no 404 errors
- FAIL: Profile data missing, errors in console

---

### Test 1.3: View Another User's Profile
**Steps:**
1. Sign in as mike@test.com
2. Navigate to `/profile/sarah`

**Expected Results:**
- [ ] Sarah's profile loads
- [ ] Public profile data visible
- [ ] Sarah's public catches visible
- [ ] Sarah's private/followers catches NOT visible (unless Mike follows Sarah)

**Pass/Fail Criteria:**
- PASS: Public profile visible, private data hidden
- FAIL: Private data exposed, or profile fails to load

---

## 2. Edit Profile Tests

### Test 2.1: Update Profile Information
**Steps:**
1. Sign in as mike@test.com
2. Click "Edit Profile" or "Status" button
3. Update the following fields:
   - Bio: "Passionate angler from the UK"
   - Full Name: "Mike Thompson"
   - Location: "London, UK"
   - Website: "https://mikefishing.com"
4. Save changes

**Expected Results:**
- [ ] Profile updates saved
- [ ] `updated_at` timestamp changed
- [ ] Changes visible immediately on profile page
- [ ] No errors

**SQL Verification:**
```sql
SELECT bio, full_name, location, website, updated_at
FROM profiles
WHERE username = 'mike';
```

**Pass/Fail Criteria:**
- PASS: All fields updated correctly
- FAIL: Updates not saved or errors occur

---

### Test 2.2: Cannot Update Another User's Profile
**Steps:**
1. Sign in as mike@test.com
2. Attempt to update sarah's profile via API/console:
```javascript
await supabase
  .from('profiles')
  .update({ bio: 'Hacked!' })
  .eq('username', 'sarah')
```

**Expected Results:**
- [ ] Update fails with "permission denied" or "no rows returned"
- [ ] RLS policy blocks update

**Pass/Fail Criteria:**
- PASS: Update blocked by RLS
- FAIL: Update succeeds (security vulnerability!)

---

## 3. Create Session Tests

### Test 3.1: Create Fishing Session
**Steps:**
1. Sign in as mike@test.com
2. Navigate to Sessions page
3. Click "Add Session"
4. Fill in:
   - Title: "Morning at Linear Fisheries"
   - Date: 2025-01-15
   - Venue: Select "Linear Fisheries" from dropdown OR enter manually
   - Notes: "Beautiful morning, water was calm"
5. Save session

**Expected Results:**
- [ ] Session created successfully
- [ ] Session appears in sessions list
- [ ] `venue_id` set if venue selected from dropdown
- [ ] `venue_name_manual` set if entered manually
- [ ] `user_id` matches logged-in user

**SQL Verification:**
```sql
SELECT title, session_date, venue_id, venue_name_manual
FROM sessions
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
ORDER BY created_at DESC
LIMIT 1;
```

**Pass/Fail Criteria:**
- PASS: Session created with correct data
- FAIL: Session not created or data incorrect

---

### Test 3.2: Soft Delete Session
**Steps:**
1. Sign in as mike@test.com
2. View sessions list
3. Click "Delete" on a session
4. Confirm deletion

**Expected Results:**
- [ ] Session disappears from list
- [ ] `deleted_at` timestamp set (soft delete)
- [ ] Session still exists in database
- [ ] Associated catches still linked (not deleted)

**SQL Verification:**
```sql
SELECT id, title, deleted_at
FROM sessions
WHERE id = '<session-id>';
```

**Pass/Fail Criteria:**
- PASS: `deleted_at` is not NULL, session hidden from UI
- FAIL: Session hard deleted or still visible

---

## 4. Create Catches Tests

### Test 4.1: Create Catch with Species from Catalog
**Steps:**
1. Sign in as mike@test.com
2. Navigate to "Add Catch" page
3. Fill in:
   - Upload image (or provide URL)
   - Title: "20lb Mirror Carp"
   - Select session: "Morning at Linear Fisheries"
   - Select species: "Mirror Carp" (from dropdown)
   - Weight: 20
   - Unit: kg
   - Location: Select "Linear Fisheries" from venue dropdown
   - Description: "Caught on boilie"
   - Bait: "Boilie"
   - Method: "Hair rig"
   - Time of day: "morning"
   - Visibility: "public"
4. Save catch

**Expected Results:**
- [ ] Catch created successfully
- [ ] `species_id` set to Mirror Carp ID
- [ ] `species_slug` set to "mirror_carp"
- [ ] `venue_id` set to Linear Fisheries ID
- [ ] `normalized_location` set via trigger
- [ ] `session_id` linked
- [ ] Catch appears in feed (public)

**SQL Verification:**
```sql
SELECT
  c.title,
  c.species_id,
  c.species_slug,
  s.name as species_name,
  c.venue_id,
  c.weight,
  c.visibility
FROM catches c
LEFT JOIN species s ON c.species_id = s.id
WHERE c.id = '<catch-id>';
```

**Pass/Fail Criteria:**
- PASS: All fields correct, species data joined properly
- FAIL: Species not linked or data missing

---

### Test 4.2: Create Catch with Custom Species
**Steps:**
1. Sign in as mike@test.com
2. Add catch with custom species not in catalog
3. Species: "Rainbow Trout" (not in species table)
4. Fill other required fields
5. Save

**Expected Results:**
- [ ] Catch created
- [ ] `species_id` is NULL
- [ ] `custom_species` set to "Rainbow Trout"
- [ ] `species_slug` is NULL
- [ ] Catch displays with custom species name

**SQL Verification:**
```sql
SELECT species_id, custom_species, species_slug
FROM catches
WHERE id = '<catch-id>';
```

**Pass/Fail Criteria:**
- PASS: `species_id` NULL, `custom_species` populated
- FAIL: Validation error or custom species not saved

---

### Test 4.3: Create Catch with Manual Venue
**Steps:**
1. Sign in as mike@test.com
2. Add catch
3. Location: Enter "My Secret Pond" (not in venues table)
4. Save

**Expected Results:**
- [ ] Catch created
- [ ] `venue_id` is NULL
- [ ] `venue_name_manual` set to "My Secret Pond"
- [ ] `normalized_location` set via trigger (lowercase)
- [ ] Catch displays with manual location

**SQL Verification:**
```sql
SELECT venue_id, venue_name_manual, normalized_location
FROM catches
WHERE id = '<catch-id>';
```

**Pass/Fail Criteria:**
- PASS: Manual venue saved correctly
- FAIL: Venue not saved or normalized incorrectly

---

### Test 4.4: Create Catch with Image Upload
**Steps:**
1. Sign in as mike@test.com
2. Add catch
3. Upload image file (JPEG/PNG < 5MB)
4. Save

**Expected Results:**
- [ ] Image uploaded to Supabase Storage `catches` bucket
- [ ] `image_url` set to storage URL
- [ ] Image displays on catch card
- [ ] Image is publicly accessible (or accessible to authorized users)

**Pass/Fail Criteria:**
- PASS: Image uploaded and URL saved
- FAIL: Upload fails or image not displayed

---

### Test 4.5: Create Catch with Conditions (JSONB)
**Steps:**
1. Sign in as mike@test.com
2. Add catch
3. Enter weather conditions:
   - Weather: "Sunny"
   - Wind: "Light breeze"
   - Temperature: "18°C"
   - Moon phase: "Full moon"
4. Save

**Expected Results:**
- [ ] Catch created
- [ ] `conditions` JSONB field populated:
```json
{
  "weather": "Sunny",
  "wind": "Light breeze",
  "temperature": "18°C",
  "moon_phase": "Full moon"
}
```

**SQL Verification:**
```sql
SELECT conditions
FROM catches
WHERE id = '<catch-id>';
```

**Pass/Fail Criteria:**
- PASS: JSONB contains all conditions
- FAIL: Conditions not saved or JSON malformed

---

### Test 4.6: Create Catch with Hide Exact Spot
**Steps:**
1. Sign in as mike@test.com
2. Add catch
3. Location: "Linear Fisheries"
4. Check "Hide exact spot" checkbox
5. Save

**Expected Results:**
- [ ] `hide_exact_spot` = true
- [ ] Other users see "Undisclosed venue" or generic location
- [ ] Owner (Mike) still sees full location

**Pass/Fail Criteria:**
- PASS: Location hidden for others, visible to owner
- FAIL: Location exposed to all users

---

## 5. Following/Unfollowing Tests

### Test 5.1: Follow Another User
**Steps:**
1. Sign in as mike@test.com
2. Navigate to sarah's profile
3. Click "Follow" button

**Expected Results:**
- [ ] Follow record created in `profile_follows`
- [ ] Sarah's follower count increments
- [ ] Mike's following count increments
- [ ] Sarah receives notification (type: `new_follower`)
- [ ] Button changes to "Following"

**SQL Verification:**
```sql
SELECT * FROM profile_follows
WHERE follower_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND following_id = (SELECT user_id FROM profiles WHERE username = 'sarah');
```

**Pass/Fail Criteria:**
- PASS: Follow relationship created, notification sent
- FAIL: Follow not created or notification missing

---

### Test 5.2: Unfollow User
**Steps:**
1. Sign in as mike@test.com (already following sarah)
2. Navigate to sarah's profile
3. Click "Following" button → "Unfollow"

**Expected Results:**
- [ ] Follow record deleted from `profile_follows`
- [ ] Sarah's follower count decrements
- [ ] Mike's following count decrements
- [ ] Button changes to "Follow"

**SQL Verification:**
```sql
SELECT COUNT(*) FROM profile_follows
WHERE follower_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND following_id = (SELECT user_id FROM profiles WHERE username = 'sarah');
-- Should return 0
```

**Pass/Fail Criteria:**
- PASS: Follow relationship removed
- FAIL: Unfollow fails or counts incorrect

---

### Test 5.3: Cannot Follow Self
**Steps:**
1. Sign in as mike@test.com
2. Navigate to own profile `/profile/mike`
3. Verify "Follow" button not shown

**Expected Results:**
- [ ] Follow button not displayed on own profile
- [ ] OR attempt to follow self is blocked by validation

**Pass/Fail Criteria:**
- PASS: Cannot follow self
- FAIL: Self-follow allowed

---

## 6. Catches with Different Visibility Tests

### Test 6.1: Public Catch Visibility
**Steps:**
1. Sign in as mike@test.com
2. Create catch with visibility = "public"
3. Sign out
4. Sign in as sarah@test.com
5. View global feed

**Expected Results:**
- [ ] Mike's public catch visible in global feed
- [ ] Catch visible on Mike's profile page
- [ ] Catch appears in search results
- [ ] Catch appears in leaderboard
- [ ] Catch appears on venue page

**Pass/Fail Criteria:**
- PASS: Public catch visible to all users
- FAIL: Catch hidden from some views

---

### Test 6.2: Followers-Only Catch Visibility
**Steps:**
1. Sign in as mike@test.com
2. Create catch with visibility = "followers"
3. Sign out
4. Sign in as sarah@test.com (who follows Mike)
5. View "Following" feed tab

**Expected Results:**
- [ ] Catch visible in Following feed for Sarah
- [ ] Catch NOT visible in global feed
- [ ] Catch NOT visible on venue page
- [ ] Catch NOT in leaderboard
- [ ] Sign in as tom@test.com (doesn't follow Mike) → catch NOT visible

**SQL Verification (as Sarah):**
```sql
-- This should return the catch
SELECT * FROM catches
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND visibility = 'followers'
AND (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profile_follows
    WHERE follower_id = auth.uid()
    AND following_id = user_id
  )
);
```

**Pass/Fail Criteria:**
- PASS: Visible to followers only
- FAIL: Visible to non-followers or hidden from followers

---

### Test 6.3: Private Catch Visibility
**Steps:**
1. Sign in as mike@test.com
2. Create catch with visibility = "private"
3. Sign out
4. Sign in as sarah@test.com

**Expected Results:**
- [ ] Catch NOT visible in any feed
- [ ] Catch NOT visible on Mike's public profile (to Sarah)
- [ ] Catch NOT in search results
- [ ] Catch NOT in leaderboard
- [ ] Sign back in as Mike → catch visible on own profile only

**Pass/Fail Criteria:**
- PASS: Only owner can see private catch
- FAIL: Catch visible to others

---

## 7. Search Tests

### Test 7.1: Search Profiles by Username
**Steps:**
1. Navigate to `/search`
2. Enter "mike" in search box
3. Press search

**Expected Results:**
- [ ] Mike's profile appears in results
- [ ] Profile shows username, avatar, bio snippet
- [ ] Clicking result navigates to Mike's profile

**Pass/Fail Criteria:**
- PASS: Correct profile found
- FAIL: No results or wrong profile

---

### Test 7.2: Search Profiles by Bio/Location
**Steps:**
1. Search for "London" (Mike's location from earlier test)
2. Press search

**Expected Results:**
- [ ] Mike's profile appears (if location set to London)
- [ ] Any other profiles with "London" in bio or location

**Pass/Fail Criteria:**
- PASS: Profiles with matching location/bio shown
- FAIL: No results or irrelevant results

---

### Test 7.3: Search Catches by Species
**Steps:**
1. Navigate to search
2. Search for "Mirror Carp"

**Expected Results:**
- [ ] All public catches with species = "Mirror Carp" shown
- [ ] Results include catches with `species_id` matching Mirror Carp
- [ ] Results include catches with `custom_species` = "Mirror Carp"
- [ ] Private/followers catches NOT shown (unless user has access)

**Pass/Fail Criteria:**
- PASS: All accessible Mirror Carp catches shown
- FAIL: Missing results or wrong species

---

### Test 7.4: Search Catches by Location
**Steps:**
1. Search for "Linear"

**Expected Results:**
- [ ] All catches from Linear Fisheries shown
- [ ] Matches on `venue_name_manual` OR venue table join
- [ ] Case-insensitive search (uses `normalized_location`)

**Pass/Fail Criteria:**
- PASS: All Linear Fisheries catches shown
- FAIL: Missing catches or case-sensitivity issues

---

### Test 7.5: Search Venues
**Steps:**
1. Search for "Linear Fisheries"

**Expected Results:**
- [ ] Venue "Linear Fisheries" appears
- [ ] Shows venue details (region, country)
- [ ] Shows catch count for this venue
- [ ] Clicking navigates to venue detail page

**Pass/Fail Criteria:**
- PASS: Venue found with correct data
- FAIL: Venue not found or data missing

---

## 8. Venue Page Tests

### Test 8.1: View Venue Detail Page
**Steps:**
1. Navigate to `/venue/linear-fisheries` (or click from search)

**Expected Results:**
- [ ] Venue name, slug, region, country displayed
- [ ] Description/notes shown
- [ ] Map displayed with coordinates (if lat/lng set)
- [ ] List of all public catches from this venue
- [ ] Catches sorted by `created_at` DESC or `total_score` DESC

**SQL Verification:**
```sql
SELECT * FROM venues WHERE slug = 'linear-fisheries';

SELECT COUNT(*) FROM catches
WHERE venue_id = (SELECT id FROM venues WHERE slug = 'linear-fisheries')
AND visibility = 'public'
AND deleted_at IS NULL;
```

**Pass/Fail Criteria:**
- PASS: Venue details and catches shown
- FAIL: 404 error or catches missing

---

### Test 8.2: Venue Catches Respect Visibility
**Steps:**
1. Sign in as mike@test.com
2. Create catch at Linear Fisheries with visibility = "private"
3. Sign out
4. Sign in as sarah@test.com
5. Navigate to Linear Fisheries venue page

**Expected Results:**
- [ ] Mike's private catch NOT shown on venue page
- [ ] Only public catches shown (+ followers catches if Sarah follows Mike)

**Pass/Fail Criteria:**
- PASS: Private catches hidden
- FAIL: Private catches exposed

---

## 9. Leaderboard & Hero Spotlight Tests

### Test 9.1: View Overall Leaderboard
**Steps:**
1. Navigate to `/leaderboard`

**Expected Results:**
- [ ] Top 100 catches shown
- [ ] Sorted by `total_score` DESC
- [ ] Each entry shows:
  - Image
  - Title
  - Species name
  - Weight
  - Owner username + avatar
  - Average rating
  - Reaction count
  - Total score

**SQL Verification:**
```sql
SELECT * FROM leaderboard_scores_mv
ORDER BY total_score DESC
LIMIT 100;
```

**Pass/Fail Criteria:**
- PASS: Leaderboard displays correctly sorted data
- FAIL: Data missing or sorting incorrect

---

### Test 9.2: Filter Leaderboard by Species
**Steps:**
1. On leaderboard page, select "Mirror Carp" from species filter
2. Click "Apply Filter"

**Expected Results:**
- [ ] Only Mirror Carp catches shown
- [ ] Sorted by total_score DESC
- [ ] Species slug filter applied

**SQL Verification:**
```sql
SELECT * FROM leaderboard_scores_mv
WHERE species_slug = 'mirror_carp'
ORDER BY total_score DESC;
```

**Pass/Fail Criteria:**
- PASS: Only Mirror Carp shown
- FAIL: Other species shown or filter doesn't work

---

### Test 9.3: Hero Spotlight on Homepage
**Steps:**
1. Navigate to homepage

**Expected Results:**
- [ ] Hero component displays top catch from leaderboard
- [ ] Shows catch with highest `total_score`
- [ ] Displays full catch details
- [ ] Clicking navigates to catch detail page

**SQL Verification:**
```sql
SELECT * FROM leaderboard_scores_mv
ORDER BY total_score DESC
LIMIT 1;
```

**Pass/Fail Criteria:**
- PASS: Top catch displayed in hero
- FAIL: Wrong catch or hero empty

---

### Test 9.4: Leaderboard Score Calculation
**Steps:**
1. Create catch with:
   - Weight: 10 kg
   - Average rating: 8.0
   - Reaction count: 5
2. Refresh materialized view: `REFRESH MATERIALIZED VIEW leaderboard_scores_mv`
3. Check leaderboard

**Expected Total Score:**
```
total_score = weight + (avg_rating * 5) + (reaction_count * 0.5)
            = 10 + (8.0 * 5) + (5 * 0.5)
            = 10 + 40 + 2.5
            = 52.5
```

**Pass/Fail Criteria:**
- PASS: Score matches calculation
- FAIL: Score incorrect

---

## 10. Insights Page Tests

### Test 10.1: View Personal Insights
**Steps:**
1. Sign in as mike@test.com
2. Navigate to `/insights`

**Expected Results:**
- [ ] Charts/tables displayed for:
  - Catches over time (by month)
  - Breakdown by venue (pie/bar chart)
  - Breakdown by species (pie/bar chart)
  - Time of day performance (morning/afternoon/evening/night)
- [ ] Data only shows Mike's catches
- [ ] Soft-deleted catches excluded

**SQL Verification:**
```sql
SELECT
  COUNT(*) as total_catches,
  COUNT(DISTINCT species_id) as unique_species,
  COUNT(DISTINCT venue_id) as unique_venues
FROM catches
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND deleted_at IS NULL;
```

**Pass/Fail Criteria:**
- PASS: Insights accurate and complete
- FAIL: Data missing or includes other users' catches

---

### Test 10.2: Filter Insights by Date Range
**Steps:**
1. On insights page
2. Select date range: "Last 3 months"
3. Apply filter

**Expected Results:**
- [ ] Charts update to show only catches from last 3 months
- [ ] Catches outside range excluded
- [ ] Counts accurate

**SQL Verification:**
```sql
SELECT COUNT(*) FROM catches
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND caught_at >= NOW() - INTERVAL '3 months'
AND deleted_at IS NULL;
```

**Pass/Fail Criteria:**
- PASS: Date filter works correctly
- FAIL: Filter doesn't work or data incorrect

---

## 11. Notifications Tests

### Test 11.1: Follow Notification
**Steps:**
1. Sign in as sarah@test.com
2. Follow mike@test.com
3. Sign out
4. Sign in as mike@test.com
5. Check notifications bell icon

**Expected Results:**
- [ ] Notification badge shows "1"
- [ ] Notification reads: "Sarah started following you"
- [ ] Type: `new_follower`
- [ ] `is_read` = false
- [ ] Clicking notification marks as read

**SQL Verification:**
```sql
SELECT * FROM notifications
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND type = 'new_follower'
ORDER BY created_at DESC
LIMIT 1;
```

**Pass/Fail Criteria:**
- PASS: Notification received and correct
- FAIL: No notification or data wrong

---

### Test 11.2: Comment Notification
**Steps:**
1. Sign in as sarah@test.com
2. Comment on Mike's catch: "Great catch!"
3. Sign out
4. Sign in as mike@test.com

**Expected Results:**
- [ ] Notification: "Sarah commented on your catch"
- [ ] Type: `new_comment`
- [ ] `catch_id` and `comment_id` populated
- [ ] Clicking navigates to catch detail page

**Pass/Fail Criteria:**
- PASS: Notification correct and navigates properly
- FAIL: No notification or navigation broken

---

### Test 11.3: Rating Notification
**Steps:**
1. Sign in as sarah@test.com
2. Rate Mike's catch: 9/10
3. Sign out
4. Sign in as mike@test.com

**Expected Results:**
- [ ] Notification: "Sarah rated your catch"
- [ ] Type: `new_rating`

**Pass/Fail Criteria:**
- PASS: Notification received
- FAIL: No notification

---

### Test 11.4: Reaction Notification
**Steps:**
1. Sign in as sarah@test.com
2. React to Mike's catch with "fire"
3. Sign out
4. Sign in as mike@test.com

**Expected Results:**
- [ ] Notification: "Sarah reacted to your catch"
- [ ] Type: `new_reaction`

**Pass/Fail Criteria:**
- PASS: Notification received
- FAIL: No notification

---

### Test 11.5: Mention Notification
**Steps:**
1. Sign in as sarah@test.com
2. Comment on any catch: "Great catch @mike!"
3. Submit comment
4. Sign out
5. Sign in as mike@test.com

**Expected Results:**
- [ ] Notification: "Sarah mentioned you in a comment"
- [ ] Type: `mention`
- [ ] `comment_id` populated
- [ ] Clicking navigates to comment

**SQL Verification:**
```sql
SELECT mentioned_usernames FROM catch_comments
WHERE id = '<comment-id>';
-- Should contain ['mike']
```

**Pass/Fail Criteria:**
- PASS: Mention detected and notification sent
- FAIL: No notification or mention not detected

---

### Test 11.6: Mark Notification as Read
**Steps:**
1. Sign in as mike@test.com (with unread notifications)
2. Click notification bell
3. Click on a notification

**Expected Results:**
- [ ] Notification marked as read
- [ ] `is_read` = true
- [ ] `read_at` timestamp set
- [ ] Badge count decrements

**SQL Verification:**
```sql
SELECT is_read, read_at FROM notifications
WHERE id = '<notification-id>';
```

**Pass/Fail Criteria:**
- PASS: Notification marked read correctly
- FAIL: Remains unread or timestamp missing

---

### Test 11.7: Notification Deduplication
**Steps:**
1. Within 5 minutes:
   - Sarah follows Mike
   - Sarah unfollows Mike
   - Sarah follows Mike again
2. Check Mike's notifications

**Expected Results:**
- [ ] Only 1 follow notification created (within 5-minute window)
- [ ] Deduplication logic in `create_notification()` prevents duplicates

**SQL Verification:**
```sql
SELECT COUNT(*) FROM notifications
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND type = 'new_follower'
AND actor_id = (SELECT user_id FROM profiles WHERE username = 'sarah')
AND created_at > NOW() - INTERVAL '5 minutes';
-- Should be 1
```

**Pass/Fail Criteria:**
- PASS: Only 1 notification
- FAIL: Multiple duplicate notifications

---

## 12. Admin Reports Tests

### Test 12.1: File Report as User
**Steps:**
1. Sign in as mike@test.com
2. View Sarah's catch
3. Click "Report" button
4. Select reason: "Inappropriate content"
5. Submit report

**Expected Results:**
- [ ] Report created with status = 'open'
- [ ] `reporter_id` = Mike's user_id
- [ ] `target_type` = 'catch'
- [ ] `target_id` = catch ID
- [ ] Admin users receive notification (type: `admin_report`)

**SQL Verification:**
```sql
SELECT * FROM reports
WHERE reporter_id = (SELECT user_id FROM profiles WHERE username = 'mike')
ORDER BY created_at DESC
LIMIT 1;
```

**Pass/Fail Criteria:**
- PASS: Report created and admins notified
- FAIL: Report not created or admins not notified

---

### Test 12.2: Admin Inspect Report
**Steps:**
1. Sign in as tom@test.com (admin)
2. Navigate to `/admin/reports`
3. View open reports

**Expected Results:**
- [ ] All open reports visible
- [ ] Each report shows:
  - Target type (catch/comment/profile)
  - Target ID
  - Reporter username
  - Reason
  - Created timestamp
  - Status
- [ ] Can click to view reported content

**Pass/Fail Criteria:**
- PASS: Reports visible with complete data
- FAIL: Reports missing or data incomplete

---

### Test 12.3: Admin Delete Catch
**Steps:**
1. Sign in as tom@test.com (admin)
2. View reported catch
3. Click "Delete" button
4. Enter reason: "Violates community guidelines"
5. Confirm deletion

**Expected Results:**
- [ ] RPC `admin_delete_catch()` called successfully
- [ ] Catch soft-deleted (`deleted_at` set)
- [ ] Catch disappears from feed
- [ ] Moderation log entry created (action: `delete_catch`)
- [ ] Catch owner receives notification (type: `admin_warning`)
- [ ] Notification includes admin's reason

**SQL Verification:**
```sql
-- Check soft delete
SELECT deleted_at FROM catches WHERE id = '<catch-id>';

-- Check moderation log
SELECT * FROM moderation_log
WHERE target_id = '<catch-id>'
AND action = 'delete_catch';

-- Check notification
SELECT * FROM notifications
WHERE catch_id = '<catch-id>'
AND type = 'admin_warning';
```

**Pass/Fail Criteria:**
- PASS: All verifications successful
- FAIL: Catch not deleted, log missing, or notification not sent

---

### Test 12.4: Admin Restore Catch
**Steps:**
1. Sign in as tom@test.com (admin)
2. View deleted catches
3. Click "Restore" on soft-deleted catch
4. Enter reason: "Mistakenly deleted"
5. Confirm restore

**Expected Results:**
- [ ] RPC `admin_restore_catch()` called
- [ ] Catch restored (`deleted_at` = NULL)
- [ ] Catch reappears in feed
- [ ] Moderation log entry created (action: `restore_catch`)
- [ ] Owner notified

**SQL Verification:**
```sql
SELECT deleted_at FROM catches WHERE id = '<catch-id>';
-- Should be NULL
```

**Pass/Fail Criteria:**
- PASS: Catch restored successfully
- FAIL: Catch still deleted or logs missing

---

### Test 12.5: Admin Delete Comment
**Steps:**
1. Sign in as tom@test.com (admin)
2. View reported comment
3. Delete comment with reason

**Expected Results:**
- [ ] RPC `admin_delete_comment()` called
- [ ] Comment soft-deleted
- [ ] Moderation log entry created
- [ ] Comment owner notified

**SQL Verification:**
```sql
SELECT deleted_at FROM catch_comments WHERE id = '<comment-id>';
```

**Pass/Fail Criteria:**
- PASS: Comment deleted with logging
- FAIL: Delete failed or logs missing

---

### Test 12.6: Admin Restore Comment
**Steps:**
1. Sign in as tom@test.com (admin)
2. Restore deleted comment

**Expected Results:**
- [ ] RPC `admin_restore_comment()` called
- [ ] Comment restored
- [ ] Moderation log entry created

**Pass/Fail Criteria:**
- PASS: Comment restored
- FAIL: Restore failed

---

### Test 12.7: Admin Warn User
**Steps:**
1. Sign in as tom@test.com (admin)
2. Navigate to user moderation page
3. Issue warning to Mike with:
   - Reason: "Posting inappropriate content"
   - Severity: "warning"
   - Duration: NULL
4. Submit

**Expected Results:**
- [ ] RPC `admin_warn_user()` called
- [ ] Warning record created in `user_warnings`
- [ ] User's `warn_count` incremented
- [ ] User's `moderation_status` = 'warned'
- [ ] Moderation log entry created
- [ ] User receives notification

**SQL Verification:**
```sql
SELECT * FROM user_warnings
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
ORDER BY created_at DESC LIMIT 1;

SELECT warn_count, moderation_status FROM profiles
WHERE username = 'mike';
```

**Pass/Fail Criteria:**
- PASS: Warning issued correctly
- FAIL: Warning not saved or status not updated

---

### Test 12.8: Admin Temporary Suspension
**Steps:**
1. Sign in as tom@test.com (admin)
2. Warn user with:
   - Severity: "temporary_suspension"
   - Duration: 24 hours
3. Submit

**Expected Results:**
- [ ] User's `moderation_status` = 'suspended'
- [ ] `suspension_until` = NOW() + 24 hours
- [ ] User cannot create catches/comments while suspended (implement validation)
- [ ] After 24 hours, status should auto-expire (requires cron job or login check)

**SQL Verification:**
```sql
SELECT moderation_status, suspension_until FROM profiles
WHERE username = 'mike';
```

**Pass/Fail Criteria:**
- PASS: Suspension set correctly
- FAIL: Status not set or duration wrong

---

### Test 12.9: Admin Permanent Ban
**Steps:**
1. Sign in as tom@test.com (admin)
2. Warn user with severity: "permanent_ban"

**Expected Results:**
- [ ] User's `moderation_status` = 'banned'
- [ ] `suspension_until` = NULL (permanent)
- [ ] User cannot log in or perform actions (requires app-level enforcement)

**Pass/Fail Criteria:**
- PASS: Ban status set
- FAIL: Status not updated

---

## 13. Rate Limiting Tests

### Test 13.1: Catch Creation Rate Limit (10 per hour)
**Steps:**
1. Sign in as mike@test.com
2. Create 10 catches rapidly (within 5 minutes)
3. Attempt to create 11th catch

**Expected Results:**
- [ ] First 10 catches succeed
- [ ] 11th catch fails with error: "Rate limit exceeded: Maximum 10 catches per hour"
- [ ] Trigger `enforce_catch_rate_limit()` blocks 11th catch

**SQL Verification:**
```sql
SELECT COUNT(*) FROM rate_limits
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND action = 'catch_creation'
AND created_at > NOW() - INTERVAL '1 hour';
-- Should be 10
```

**Pass/Fail Criteria:**
- PASS: 11th catch blocked
- FAIL: Rate limit not enforced

---

### Test 13.2: Comment Rate Limit (30 per hour)
**Steps:**
1. Sign in as mike@test.com
2. Create 30 comments on various catches
3. Attempt 31st comment

**Expected Results:**
- [ ] First 30 succeed
- [ ] 31st fails with error: "Rate limit exceeded: Maximum 30 comments per hour"

**SQL Verification:**
```sql
SELECT COUNT(*) FROM rate_limits
WHERE user_id = (SELECT user_id FROM profiles WHERE username = 'mike')
AND action = 'comment_creation'
AND created_at > NOW() - INTERVAL '1 hour';
```

**Pass/Fail Criteria:**
- PASS: 31st comment blocked
- FAIL: Rate limit not enforced

---

### Test 13.3: Report Rate Limit (5 per hour)
**Steps:**
1. Sign in as mike@test.com
2. File 5 reports
3. Attempt 6th report

**Expected Results:**
- [ ] First 5 succeed
- [ ] 6th fails with error: "Rate limit exceeded: Maximum 5 reports per hour"

**Pass/Fail Criteria:**
- PASS: 6th report blocked
- FAIL: Rate limit not enforced

---

### Test 13.4: Get Rate Limit Status
**Steps:**
1. Sign in as mike@test.com (who has created 7 catches in last hour)
2. Call RPC:
```sql
SELECT * FROM get_rate_limit_status(
  (SELECT user_id FROM profiles WHERE username = 'mike'),
  'catch_creation',
  10,
  60
);
```

**Expected Results:**
- [ ] Returns JSON:
```json
{
  "allowed": 10,
  "used": 7,
  "remaining": 3,
  "reset_at": "2025-01-15T16:30:00Z"
}
```

**Pass/Fail Criteria:**
- PASS: Correct counts returned
- FAIL: Counts incorrect

---

### Test 13.5: Rate Limit Cleanup
**Steps:**
1. Wait 2+ hours (or manually set old timestamps in rate_limits table)
2. Call RPC:
```sql
SELECT cleanup_rate_limits();
```

**Expected Results:**
- [ ] Old rate_limits records (> 2 hours) deleted
- [ ] Recent records retained

**SQL Verification:**
```sql
SELECT COUNT(*) FROM rate_limits
WHERE created_at < NOW() - INTERVAL '2 hours';
-- Should be 0 after cleanup
```

**Pass/Fail Criteria:**
- PASS: Old records deleted
- FAIL: Old records remain

---

## 14. Social Interaction Tests

### Test 14.1: Add Reaction (Like)
**Steps:**
1. Sign in as sarah@test.com
2. View Mike's catch
3. Click "Like" button (heart icon)

**Expected Results:**
- [ ] Reaction created with type = 'like'
- [ ] Button changes to "filled" state
- [ ] Reaction count increments
- [ ] Mike receives notification

**SQL Verification:**
```sql
SELECT reaction FROM catch_reactions
WHERE catch_id = '<catch-id>'
AND user_id = (SELECT user_id FROM profiles WHERE username = 'sarah');
```

**Pass/Fail Criteria:**
- PASS: Reaction saved and notification sent
- FAIL: Reaction not saved or no notification

---

### Test 14.2: Change Reaction Type
**Steps:**
1. Sign in as sarah@test.com (already liked catch)
2. Click "Love" button

**Expected Results:**
- [ ] Reaction updated from 'like' to 'love'
- [ ] No duplicate reaction created
- [ ] Only 1 reaction per user per catch

**SQL Verification:**
```sql
SELECT COUNT(*) FROM catch_reactions
WHERE catch_id = '<catch-id>'
AND user_id = (SELECT user_id FROM profiles WHERE username = 'sarah');
-- Should be 1
```

**Pass/Fail Criteria:**
- PASS: Reaction updated, not duplicated
- FAIL: Multiple reactions or update failed

---

### Test 14.3: Remove Reaction
**Steps:**
1. Sign in as sarah@test.com (already reacted)
2. Click reaction button again

**Expected Results:**
- [ ] Reaction deleted
- [ ] Button returns to unfilled state
- [ ] Reaction count decrements

**Pass/Fail Criteria:**
- PASS: Reaction removed
- FAIL: Reaction persists

---

### Test 14.4: Add Comment
**Steps:**
1. Sign in as sarah@test.com
2. View Mike's catch
3. Write comment: "Amazing catch!"
4. Submit

**Expected Results:**
- [ ] Comment created
- [ ] Comment appears instantly
- [ ] Mike receives notification
- [ ] Comment count increments

**SQL Verification:**
```sql
SELECT content FROM catch_comments
WHERE catch_id = '<catch-id>'
AND user_id = (SELECT user_id FROM profiles WHERE username = 'sarah')
ORDER BY created_at DESC LIMIT 1;
```

**Pass/Fail Criteria:**
- PASS: Comment saved and notification sent
- FAIL: Comment not saved or no notification

---

### Test 14.5: Delete Own Comment
**Steps:**
1. Sign in as sarah@test.com
2. View catch with own comment
3. Click "Delete" on comment

**Expected Results:**
- [ ] Comment soft-deleted (`deleted_at` set)
- [ ] Comment disappears from view
- [ ] Comment count decrements

**Pass/Fail Criteria:**
- PASS: Comment deleted
- FAIL: Delete failed or comment still visible

---

### Test 14.6: Cannot Delete Others' Comments (as non-admin)
**Steps:**
1. Sign in as mike@test.com
2. Attempt to delete Sarah's comment via API/console

**Expected Results:**
- [ ] Delete blocked by RLS policy
- [ ] Error: "permission denied"

**Pass/Fail Criteria:**
- PASS: Delete blocked
- FAIL: Delete succeeds (security issue!)

---

### Test 14.7: Add Rating
**Steps:**
1. Sign in as sarah@test.com
2. View Mike's catch
3. Rate catch: 9/10
4. Submit

**Expected Results:**
- [ ] Rating created
- [ ] Average rating updates
- [ ] Mike receives notification
- [ ] Leaderboard score updates

**SQL Verification:**
```sql
SELECT rating FROM ratings
WHERE catch_id = '<catch-id>'
AND user_id = (SELECT user_id FROM profiles WHERE username = 'sarah');
```

**Pass/Fail Criteria:**
- PASS: Rating saved correctly
- FAIL: Rating not saved or average wrong

---

### Test 14.8: Update Rating
**Steps:**
1. Sign in as sarah@test.com (already rated catch 9/10)
2. Change rating to 10/10

**Expected Results:**
- [ ] Rating updated (not duplicated)
- [ ] Average rating recalculates
- [ ] Only 1 rating per user per catch

**SQL Verification:**
```sql
SELECT COUNT(*) FROM ratings
WHERE catch_id = '<catch-id>'
AND user_id = (SELECT user_id FROM profiles WHERE username = 'sarah');
-- Should be 1
```

**Pass/Fail Criteria:**
- PASS: Rating updated correctly
- FAIL: Duplicate rating or update failed

---

### Test 14.9: Cannot Rate Own Catch
**Steps:**
1. Sign in as mike@test.com
2. Attempt to rate own catch

**Expected Results:**
- [ ] Rating button disabled OR
- [ ] RLS policy blocks insert: `auth.uid() <> (SELECT user_id FROM catches WHERE id = catch_id)`

**Pass/Fail Criteria:**
- PASS: Cannot rate own catch
- FAIL: Self-rating allowed

---

### Test 14.10: Cannot Rate When Ratings Disabled
**Steps:**
1. Sign in as mike@test.com
2. Update catch: `allow_ratings = false`
3. Sign in as sarah@test.com
4. Attempt to rate catch

**Expected Results:**
- [ ] Rating blocked by RLS policy
- [ ] Error or button disabled

**Pass/Fail Criteria:**
- PASS: Rating blocked
- FAIL: Rating succeeds

---

## 15. Performance & Edge Cases

### Test 15.1: Load Feed with 100+ Catches
**Steps:**
1. Seed database with 100+ public catches
2. Navigate to feed

**Expected Results:**
- [ ] Feed loads within 2 seconds
- [ ] Pagination works (if implemented)
- [ ] No performance degradation

**Pass/Fail Criteria:**
- PASS: Acceptable performance
- FAIL: Slow load (> 5 seconds)

---

### Test 15.2: Soft-Deleted Catches Excluded Everywhere
**Steps:**
1. Soft delete a catch
2. Check all views:
   - Global feed
   - User profile
   - Search results
   - Venue page
   - Leaderboard
   - Insights

**Expected Results:**
- [ ] Deleted catch NOT visible in any view
- [ ] Owner can still see in "deleted items" view (if implemented)

**Pass/Fail Criteria:**
- PASS: Deleted catch hidden everywhere
- FAIL: Deleted catch appears in any view

---

### Test 15.3: Leaderboard Materialized View Refresh
**Steps:**
1. Create new catch
2. Add rating to catch
3. Run:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_scores_mv;
```

**Expected Results:**
- [ ] New catch appears in leaderboard
- [ ] Score reflects new ratings
- [ ] Refresh completes without errors

**Pass/Fail Criteria:**
- PASS: View refreshes successfully
- FAIL: Refresh fails or data stale

---

### Test 15.4: Null/Empty Field Handling
**Steps:**
1. Create catch with minimal fields (only required)
2. Leave optional fields NULL (description, bait, method, etc.)

**Expected Results:**
- [ ] Catch created successfully
- [ ] NULL fields handled gracefully in UI
- [ ] No "undefined" or "null" displayed to users

**Pass/Fail Criteria:**
- PASS: NULL fields handled well
- FAIL: UI breaks or shows "null"

---

### Test 15.5: Very Long Text Handling
**Steps:**
1. Create catch with very long description (5000+ characters)
2. Create comment with very long text

**Expected Results:**
- [ ] Text saved successfully (up to column limit)
- [ ] UI handles long text (scrollable, truncated, etc.)
- [ ] No database errors

**Pass/Fail Criteria:**
- PASS: Long text handled
- FAIL: Errors or UI breaks

---

## Test Summary

### Pass/Fail Criteria Summary

**PASS if:**
- All critical features work as expected
- Security policies (RLS) properly enforced
- Rate limiting functions correctly
- Admin moderation tools work
- Notifications sent correctly
- No data leaks or permission bypasses

**FAIL if:**
- Any RLS policy bypassed
- Private data exposed
- Rate limiting not enforced
- Admin functions fail
- Critical features broken

### Testing Priority

**P0 (Critical - Must Pass):**
- All RLS policy tests (6.1-6.3, 14.6, 14.9)
- Rate limiting tests (13.1-13.3)
- Admin moderation tests (12.3-12.9)

**P1 (High - Should Pass):**
- Core CRUD tests (create catch, session, profile)
- Visibility tests (public/followers/private)
- Search functionality
- Leaderboard accuracy

**P2 (Medium - Nice to Have):**
- Notifications
- Social interactions
- Insights page
- Performance tests

**P3 (Low - Optional):**
- Edge cases
- Long text handling
- Null field handling

---

## Post-Deployment Verification

After deployment to production:

1. [ ] Run all P0 tests
2. [ ] Run all P1 tests
3. [ ] Spot-check P2 tests
4. [ ] Monitor error logs for 24 hours
5. [ ] Check Supabase realtime logs for RLS errors
6. [ ] Verify rate limiting in production traffic
7. [ ] Test admin functions in production (use test accounts)

---

## Notes

- **Admin Account**: Ensure at least one user is in `admin_users` table before testing admin features
- **Seed Data**: Use `seed-v2.sql` for consistent test data
- **Materialized View**: Remember to refresh after making data changes for leaderboard tests
- **Rate Limits**: May need to wait or manually reset `rate_limits` table between test runs
- **Notifications**: Requires realtime subscriptions to be set up on frontend

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Schema Version**: V2 Complete
