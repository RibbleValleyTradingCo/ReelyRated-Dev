# Security Policies - ReelyRated V2

## Overview

This document describes all security policies, Row-Level Security (RLS) rules, admin function security, rate limiting configuration, and GDPR compliance considerations for the ReelyRated V2 database schema.

**Security Principle**: Defense in depth - multiple layers of security at database, API, and application levels.

---

## Table of Contents

1. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
2. [Admin Function Security](#admin-function-security)
3. [Rate Limiting Configuration](#rate-limiting-configuration)
4. [Visibility Enforcement Rules](#visibility-enforcement-rules)
5. [Data Deletion Policies](#data-deletion-policies)
6. [GDPR Compliance](#gdpr-compliance)
7. [Security Assumptions & Risks](#security-assumptions--risks)
8. [Security Testing Checklist](#security-testing-checklist)

---

## Row-Level Security (RLS) Policies

All tables have RLS enabled to enforce access control at the database layer.

### Principle: RLS is Always Enabled

**Critical Rule**: Never disable RLS on any table containing user data. If a query needs to bypass RLS, use a SECURITY DEFINER function with explicit authorization checks.

---

### 1. Profiles Table

**RLS Enabled**: Yes

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);
```

**Purpose**: All user profiles are publicly viewable (username, bio, avatar, location, etc.)

**Rationale**: This is a social app - users need to discover and view each other's profiles

**Risk**: Profile data is public. Users should be informed not to include sensitive information.

---

#### Policy 2: Owner-Only Updates
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
```

**Purpose**: Users can only update their own profile

**Critical**: Prevents users from modifying other users' profiles (username, bio, warn_count, etc.)

**Test**: Attempt to update another user's profile → should fail with "permission denied"

---

### 2. Sessions Table

**RLS Enabled**: Yes

#### Policy 1: Owner-Only Read
```sql
CREATE POLICY "Sessions are viewable by owner"
ON sessions FOR SELECT
USING (auth.uid() = user_id);
```

**Purpose**: Sessions are private to the user who created them

**Rationale**: Sessions may contain private fishing spots or personal notes

---

#### Policy 2: Owner-Only Insert
```sql
CREATE POLICY "Users can insert own sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Purpose**: Users can only create sessions for themselves

---

#### Policy 3: Owner-Only Update
```sql
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
USING (auth.uid() = user_id);
```

---

#### Policy 4: Owner-Only Delete
```sql
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (auth.uid() = user_id);
```

**Note**: Deletes are soft deletes (sets `deleted_at`) via application logic

---

### 3. Catches Table

**RLS Enabled**: Yes

**Critical**: Most complex RLS policies - enforce visibility rules (public/followers/private)

#### Policy 1: Public Catches - Read by All
```sql
CREATE POLICY "Public catches are viewable by everyone"
ON catches FOR SELECT
USING (visibility = 'public' AND deleted_at IS NULL);
```

**Purpose**: Public catches visible to all authenticated users

**Visibility**: Shown in global feed, search, leaderboards, venue pages

---

#### Policy 2: Followers Catches - Read by Followers
```sql
CREATE POLICY "Followers catches viewable by followers"
ON catches FOR SELECT
USING (
  visibility = 'followers'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM profile_follows
    WHERE follower_id = auth.uid()
    AND following_id = catches.user_id
  )
);
```

**Purpose**: Catches with visibility='followers' only visible to users who follow the owner

**Performance Note**: Uses `EXISTS` subquery - indexed on `profile_follows(follower_id, following_id)`

**Visibility**: Shown in following feed only, NOT in global feed, search, or leaderboards

---

#### Policy 3: Private Catches - Read by Owner Only
```sql
CREATE POLICY "Private catches viewable by owner"
ON catches FOR SELECT
USING (
  visibility = 'private'
  AND deleted_at IS NULL
  AND auth.uid() = user_id
);
```

**Purpose**: Private catches only visible to the owner

**Visibility**: Not shown anywhere except owner's own profile

---

#### Policy 4: Owner Can Always See Own Catches
```sql
CREATE POLICY "Users can view own catches"
ON catches FOR SELECT
USING (auth.uid() = user_id);
```

**Purpose**: Owners can see ALL their own catches, including:
- Private catches
- Soft-deleted catches (for recovery)
- Followers-only catches

**Important**: This policy combines with the above policies (OR logic)

---

#### Policy 5: Owner-Only Insert
```sql
CREATE POLICY "Users can insert own catches"
ON catches FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Purpose**: Users can only create catches for themselves

**Rate Limiting**: Enforced via `enforce_catch_rate_limit()` trigger (10 per hour)

---

#### Policy 6: Owner-Only Update
```sql
CREATE POLICY "Users can update own catches"
ON catches FOR UPDATE
USING (auth.uid() = user_id);
```

**Purpose**: Users can edit their own catches (change visibility, edit description, etc.)

---

#### Policy 7: Owner-Only Soft Delete
```sql
CREATE POLICY "Users can soft-delete own catches"
ON catches FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);
```

**Purpose**: Soft deletes (setting `deleted_at`) can only be done by owner or admins (via SECURITY DEFINER function)

---

### 4. Catch Comments Table

**RLS Enabled**: Yes

#### Policy 1: Comments Visible if Catch Visible
```sql
CREATE POLICY "Comments viewable if catch viewable"
ON catch_comments FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    -- Comment is on a public catch
    EXISTS (
      SELECT 1 FROM catches
      WHERE id = catch_comments.catch_id
      AND visibility = 'public'
      AND deleted_at IS NULL
    )
    OR
    -- Comment is on a followers catch and viewer follows owner
    EXISTS (
      SELECT 1 FROM catches c
      JOIN profile_follows pf ON pf.following_id = c.user_id
      WHERE c.id = catch_comments.catch_id
      AND c.visibility = 'followers'
      AND c.deleted_at IS NULL
      AND pf.follower_id = auth.uid()
    )
    OR
    -- Viewer is the catch owner
    EXISTS (
      SELECT 1 FROM catches
      WHERE id = catch_comments.catch_id
      AND user_id = auth.uid()
    )
  )
);
```

**Purpose**: Comments inherit visibility from parent catch

**Rationale**: If you can see the catch, you can see its comments

**Performance**: Multiple `EXISTS` subqueries - may need optimization for high-traffic apps

---

#### Policy 2: Users Can Comment on Visible Catches
```sql
CREATE POLICY "Users can insert comments on viewable catches"
ON catch_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM catches
      WHERE id = catch_id
      AND visibility = 'public'
      AND deleted_at IS NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM catches c
      JOIN profile_follows pf ON pf.following_id = c.user_id
      WHERE c.id = catch_id
      AND c.visibility = 'followers'
      AND c.deleted_at IS NULL
      AND pf.follower_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM catches
      WHERE id = catch_id
      AND user_id = auth.uid()
    )
  )
);
```

**Purpose**: Users can only comment on catches they can see

**Rate Limiting**: Enforced via `enforce_comment_rate_limit()` trigger (30 per hour)

---

#### Policy 3: Owner-Only Soft Delete
```sql
CREATE POLICY "Users can soft-delete own comments"
ON catch_comments FOR UPDATE
USING (auth.uid() = user_id);
```

**Purpose**: Users can delete their own comments

**Admin Override**: Admins use `admin_delete_comment()` SECURITY DEFINER function

---

### 5. Catch Reactions Table

**RLS Enabled**: Yes

#### Policy 1: Reactions Visible if Catch Visible
```sql
CREATE POLICY "Reactions viewable if catch viewable"
ON catch_reactions FOR SELECT
USING (
  -- Same logic as comments - reactions inherit catch visibility
  EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND visibility = 'public' AND deleted_at IS NULL)
  OR EXISTS (
    SELECT 1 FROM catches c
    JOIN profile_follows pf ON pf.following_id = c.user_id
    WHERE c.id = catch_id AND c.visibility = 'followers' AND c.deleted_at IS NULL
    AND pf.follower_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND user_id = auth.uid())
);
```

---

#### Policy 2: Users Can React to Visible Catches
```sql
CREATE POLICY "Users can insert reactions on viewable catches"
ON catch_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND visibility = 'public' AND deleted_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM catches c
      JOIN profile_follows pf ON pf.following_id = c.user_id
      WHERE c.id = catch_id AND c.visibility = 'followers' AND c.deleted_at IS NULL
      AND pf.follower_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND user_id = auth.uid())
  )
);
```

**Purpose**: Users can only react to catches they can see

---

#### Policy 3: Users Can Delete Own Reactions
```sql
CREATE POLICY "Users can delete own reactions"
ON catch_reactions FOR DELETE
USING (auth.uid() = user_id);
```

---

### 6. Ratings Table

**RLS Enabled**: Yes

#### Policy 1: Ratings Visible if Catch Visible
```sql
CREATE POLICY "Ratings viewable if catch viewable"
ON ratings FOR SELECT
USING (
  -- Same logic as comments/reactions
  EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND visibility = 'public' AND deleted_at IS NULL)
  OR EXISTS (
    SELECT 1 FROM catches c
    JOIN profile_follows pf ON pf.following_id = c.user_id
    WHERE c.id = catch_id AND c.visibility = 'followers' AND c.deleted_at IS NULL
    AND pf.follower_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND user_id = auth.uid())
);
```

---

#### Policy 2: Users Can Rate Visible, Ratable Catches (Not Own)
```sql
CREATE POLICY "Users can insert ratings on ratable catches"
ON ratings FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() <> (SELECT user_id FROM catches WHERE id = catch_id)
  AND EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND allow_ratings = true)
  AND (
    EXISTS (SELECT 1 FROM catches WHERE id = catch_id AND visibility = 'public' AND deleted_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM catches c
      JOIN profile_follows pf ON pf.following_id = c.user_id
      WHERE c.id = catch_id AND c.visibility = 'followers' AND c.deleted_at IS NULL
      AND pf.follower_id = auth.uid()
    )
  )
);
```

**Purpose**: Prevent users from rating their own catches

**Additional Check**: Only rate catches with `allow_ratings = true`

---

#### Policy 3: Users Can Update Own Ratings
```sql
CREATE POLICY "Users can update own ratings"
ON ratings FOR UPDATE
USING (auth.uid() = user_id);
```

**Purpose**: Users can change their rating (e.g., from 8 to 9)

---

#### Policy 4: Users Can Delete Own Ratings
```sql
CREATE POLICY "Users can delete own ratings"
ON ratings FOR DELETE
USING (auth.uid() = user_id);
```

---

### 7. Profile Follows Table

**RLS Enabled**: Yes

#### Policy 1: Follows Publicly Visible
```sql
CREATE POLICY "Follows are viewable by everyone"
ON profile_follows FOR SELECT
USING (true);
```

**Purpose**: Follow relationships are public (for now)

**Future Enhancement**: Could add private profiles feature

---

#### Policy 2: Users Can Follow Others
```sql
CREATE POLICY "Users can follow others"
ON profile_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);
```

**Purpose**: Users can only create follows where they are the follower

**Validation Needed**: Application should prevent self-follows (follower_id = following_id)

---

#### Policy 3: Users Can Unfollow
```sql
CREATE POLICY "Users can unfollow"
ON profile_follows FOR DELETE
USING (auth.uid() = follower_id);
```

**Purpose**: Users can only delete follows where they are the follower

---

### 8. Notifications Table

**RLS Enabled**: Yes

#### Policy 1: Users See Own Notifications
```sql
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);
```

**Purpose**: Strict privacy - users can only see their own notifications

---

#### Policy 2: Users Can Mark Own Notifications as Read
```sql
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);
```

**Purpose**: Users can mark notifications as read/unread

---

### 9. Reports Table

**RLS Enabled**: Yes

#### Policy 1: Users See Own Reports
```sql
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = reporter_id);
```

**Purpose**: Users can only see reports they filed

**Admin Access**: Admins view all reports via service role (not RLS)

---

#### Policy 2: Users Can File Reports
```sql
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);
```

**Rate Limiting**: Enforced via `enforce_report_rate_limit()` trigger (5 per hour)

---

### 10. Admin Tables

#### Admin Users Table
**RLS Enabled**: Yes

```sql
CREATE POLICY "Admin list viewable by admins only"
ON admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);
```

**Purpose**: Only admins can see the list of admins

**Critical**: Prevents privilege escalation - regular users cannot see who is admin

---

#### User Warnings Table
**RLS Enabled**: Yes

```sql
CREATE POLICY "Users can view own warnings"
ON user_warnings FOR SELECT
USING (auth.uid() = user_id);
```

**Purpose**: Users can see warnings issued to them

**Transparency**: Users should know if they've been warned

---

#### Moderation Log Table
**RLS Enabled**: Yes

**Policy**: No SELECT policy for regular users

**Purpose**: Moderation log is admin-only (accessed via service role)

**Transparency**: Could add policy for users to see entries related to their own content

---

#### Rate Limits Table
**RLS Enabled**: Yes

**Policy**: Managed by SECURITY DEFINER functions only

**Purpose**: Users don't directly query this table - use `get_rate_limit_status()` RPC

---

### 11. Lookup Tables (Species, Venues, Water Types, Baits, Tags)

**RLS Enabled**: Yes

**Policy**: Read-only for all users

```sql
CREATE POLICY "Species are viewable by everyone"
ON species FOR SELECT
USING (true);
```

**Purpose**: Reference data is publicly readable

**Updates**: Only via service role or admin functions (no INSERT policy for users)

---

## Admin Function Security

All admin functions use `SECURITY DEFINER` to bypass RLS, with explicit authorization checks.

### Security Pattern

```sql
CREATE OR REPLACE FUNCTION admin_delete_catch(...)
RETURNS void AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- 1. Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- 2. Perform privileged action
  UPDATE catches SET deleted_at = NOW() WHERE id = p_catch_id;

  -- 3. Log action
  INSERT INTO moderation_log (...) VALUES (...);

  -- 4. Notify user
  PERFORM create_notification(...);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Critical Security Measures

1. **Authorization Check First**: Always check `admin_users` table before performing action
2. **Audit Logging**: Log all admin actions to `moderation_log`
3. **User Notification**: Notify affected users of admin actions
4. **No Direct Data Exposure**: Return only success/failure, not sensitive data

---

### Admin Functions List

| Function | Purpose | Authorization | Logging |
|----------|---------|---------------|---------|
| `admin_delete_catch()` | Soft-delete catch | Admin only | Yes |
| `admin_restore_catch()` | Restore deleted catch | Admin only | Yes |
| `admin_delete_comment()` | Soft-delete comment | Admin only | Yes |
| `admin_restore_comment()` | Restore deleted comment | Admin only | Yes |
| `admin_warn_user()` | Issue warning/suspension | Admin only | Yes |
| `notify_admins()` | Send notification to all admins | Admin only | No |

---

### Security Definer Risks

**Risk**: SECURITY DEFINER functions run with creator's privileges (superuser)

**Mitigations**:
1. Explicit authorization checks (never trust caller)
2. Input validation (prevent SQL injection)
3. Minimal scope (only perform necessary actions)
4. Audit logging (track all invocations)
5. No dynamic SQL (avoid `EXECUTE` with user input)

---

## Rate Limiting Configuration

Rate limits are enforced at the database level via triggers.

### Rate Limit Rules

| Action | Limit | Window | Enforcement |
|--------|-------|--------|-------------|
| Catch creation | 10 | 1 hour | Trigger `enforce_catch_rate_limit()` |
| Comment creation | 30 | 1 hour | Trigger `enforce_comment_rate_limit()` |
| Report creation | 5 | 1 hour | Trigger `enforce_report_rate_limit()` |

---

### Implementation Pattern

```sql
CREATE OR REPLACE FUNCTION enforce_catch_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER := 10;
  v_window_minutes INTEGER := 60;
BEGIN
  -- Check rate limit
  SELECT COUNT(*) INTO v_count
  FROM rate_limits
  WHERE user_id = NEW.user_id
    AND action = 'catch_creation'
    AND created_at > NOW() - (v_window_minutes || ' minutes')::INTERVAL;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % catches per hour', v_limit;
  END IF;

  -- Record this action
  INSERT INTO rate_limits (user_id, action, metadata)
  VALUES (NEW.user_id, 'catch_creation', jsonb_build_object('catch_id', NEW.id));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Rate Limit Configuration

**Adjustable Parameters**:
- `v_limit`: Maximum actions allowed
- `v_window_minutes`: Time window (60 minutes = 1 hour)

**To Change Limits**: Update trigger function and redeploy

**Emergency Override**: Disable trigger temporarily (not recommended):
```sql
ALTER TABLE catches DISABLE TRIGGER enforce_catch_rate_limit_trigger;
```

---

### Rate Limit Cleanup

**Function**: `cleanup_rate_limits()`

**Purpose**: Delete old rate_limits records (> 2 hours old)

**Frequency**: Run via cron job every 2-4 hours

**Example Cron**:
```sql
SELECT cron.schedule('cleanup-rate-limits', '0 */2 * * *',
  'SELECT cleanup_rate_limits()');
```

---

### User-Facing Rate Limit Status

**Function**: `get_rate_limit_status(user_id, action, limit, window_minutes)`

**Returns**:
```json
{
  "allowed": 10,
  "used": 7,
  "remaining": 3,
  "reset_at": "2025-01-15T16:30:00Z"
}
```

**Use Case**: Display to user: "You have 3 catches remaining. Resets at 4:30 PM"

---

## Visibility Enforcement Rules

### Three Visibility Levels

| Visibility | Who Can See | Shown In |
|------------|-------------|----------|
| `public` | Everyone | Global feed, search, leaderboards, venue pages |
| `followers` | Followers + owner | Following feed only |
| `private` | Owner only | Owner's profile only (when signed in as owner) |

---

### Visibility Enforcement Points

1. **RLS Policies**: Database-level enforcement (catches, comments, reactions, ratings)
2. **Feed Queries**: Application filters by visibility
3. **Leaderboard View**: Only includes public catches
4. **Search Results**: Only public catches (+ followers if following)
5. **Venue Pages**: Only public catches

---

### Hide Exact Spot

**Column**: `catches.hide_exact_spot` (BOOLEAN)

**Purpose**: Hide precise location while still showing general area

**Implementation**: Application-level logic
```javascript
function getDisplayLocation(catch, currentUserId) {
  if (catch.hide_exact_spot && catch.user_id !== currentUserId) {
    return "Undisclosed venue";
  }
  return catch.location_label || catch.venue_name_manual;
}
```

**Security Note**: Database still stores full location - this is UI-only privacy

---

## Data Deletion Policies

### Soft Delete vs Hard Delete

#### Soft Delete (Default)

**Tables Using Soft Delete**:
- `catches` (deleted_at)
- `sessions` (deleted_at)
- `catch_comments` (deleted_at)

**Purpose**:
1. Allow user to undo deletion
2. Preserve data for moderation review
3. Maintain referential integrity

**Implementation**: Set `deleted_at = NOW()`

**Query Pattern**: Always filter `WHERE deleted_at IS NULL`

---

#### Hard Delete (Rare)

**Tables Using Hard Delete**:
- `catch_reactions` (no deleted_at column)
- `ratings` (no deleted_at column)
- `profile_follows` (no deleted_at column)

**Rationale**: These are lightweight actions that don't need soft delete

**Restoration**: Not possible - deletion is permanent

---

### Admin Deletion vs User Deletion

| Actor | Method | Logged | Notification |
|-------|--------|--------|--------------|
| User | Sets `deleted_at` via RLS | No | No |
| Admin | Calls `admin_delete_catch()` | Yes (moderation_log) | Yes (owner notified) |

---

### Cascading Deletes

**FK Constraints**: Most are `ON DELETE RESTRICT` or no action

**Rationale**: Prevent accidental data loss

**Example**: Cannot delete user profile while catches exist (must soft-delete catches first)

---

### GDPR Right to Erasure

**User Requests Full Deletion**:

1. Soft-delete all user's catches, sessions, comments
2. Anonymize or delete reactions, ratings, follows
3. Delete notifications
4. Delete reports filed by user
5. Mark profile as deleted (or hard delete if allowed)

**Implementation**: Create `gdpr_delete_user(user_id)` function

**Retention**: May need to retain some data for legal/moderation purposes (e.g., banned users)

---

## GDPR Compliance

### Data We Collect

| Data Type | Purpose | Legal Basis |
|-----------|---------|-------------|
| Email | Authentication | Contract |
| Username | Profile identification | Contract |
| Bio, Location, Website | Profile customization | Consent |
| Catches, Sessions | Core app functionality | Contract |
| Comments, Ratings, Reactions | Social features | Consent |
| IP Address (Supabase logs) | Security, fraud prevention | Legitimate Interest |
| Rate Limits | Abuse prevention | Legitimate Interest |
| Moderation Logs | Safety, legal compliance | Legitimate Interest |

---

### User Rights

1. **Right to Access**: Export all user data via `export_user_data(user_id)` function
2. **Right to Rectification**: Users can edit profile, catches, sessions
3. **Right to Erasure**: Implement `gdpr_delete_user(user_id)` function
4. **Right to Restriction**: Allow users to set catches to private
5. **Right to Data Portability**: Export data in JSON format
6. **Right to Object**: Allow users to disable notifications, analytics

---

### Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Active catches | Indefinite | User content |
| Soft-deleted catches | 30 days | Allow recovery |
| Moderation logs | 2 years | Legal compliance |
| Rate limits | 2 hours | No longer needed |
| Notifications | 90 days | User convenience |
| Deleted accounts | 30 days | Allow account recovery |

**Implementation**: Add cron jobs to purge old data

---

### Privacy Policy Requirements

Users must be informed:
1. What data is collected
2. How data is used
3. Who can see their data (public/followers/private)
4. How to request data export or deletion
5. Cookie usage (if applicable)

---

## Security Assumptions & Risks

### Assumptions

1. **Supabase Auth is Secure**: We trust Supabase's authentication system
2. **Service Role Key is Protected**: Never exposed to client, only used in secure backend
3. **Admins are Trusted**: Admin users will not abuse SECURITY DEFINER functions
4. **Users Read Privacy Settings**: Users understand public/followers/private visibility
5. **HTTPS Enforced**: All connections use TLS encryption
6. **SQL Injection Protected**: Supabase client library uses parameterized queries

---

### Known Risks

#### Risk 1: Admin Account Compromise
**Impact**: High - full database access
**Mitigation**:
- Use strong passwords + 2FA for admin accounts
- Limit number of admins
- Audit moderation logs regularly
- Consider separate "super admin" role for critical actions

---

#### Risk 2: RLS Policy Bypass
**Impact**: Critical - data exposure
**Mitigation**:
- Never disable RLS
- Test all policies thoroughly
- Use service role only in trusted backend code
- Monitor Supabase logs for RLS errors

---

#### Risk 3: Rate Limit Bypass
**Impact**: Medium - spam, abuse
**Mitigation**:
- Enforce at database level (triggers)
- Monitor for unusual activity
- Add secondary rate limits at API gateway level

---

#### Risk 4: Enumeration Attacks
**Impact**: Low - user discovery
**Mitigation**:
- Usernames are public by design
- Consider rate limiting profile lookups
- Add CAPTCHA for search/signup

---

#### Risk 5: Soft-Deleted Data Exposure
**Impact**: Medium - privacy leak
**Mitigation**:
- Always filter `deleted_at IS NULL` in queries
- Automated tests to verify soft-delete hiding
- Hard delete after retention period

---

#### Risk 6: GDPR Non-Compliance
**Impact**: High - legal liability
**Mitigation**:
- Implement data export function
- Implement data deletion function
- Privacy policy in place
- Cookie consent (if using analytics)
- DPA with Supabase

---

### Security Monitoring

**What to Monitor**:
1. Supabase Auth logs (failed logins, unusual locations)
2. RLS policy violations (permission denied errors)
3. Admin function invocations (moderation_log)
4. Rate limit triggers (unusual spike in errors)
5. Large data exports (potential scraping)

**Tools**:
- Supabase Dashboard → Logs
- Supabase Dashboard → API usage
- Custom alerting on `moderation_log` table

---

## Security Testing Checklist

### Pre-Deployment

- [ ] All tables have RLS enabled
- [ ] All RLS policies tested (see MANUAL_TEST_CHECKLIST.md)
- [ ] Admin functions require authorization
- [ ] Rate limiting enforced
- [ ] Soft deletes hide data correctly
- [ ] SECURITY DEFINER functions validated (no SQL injection)
- [ ] Service role key not exposed in frontend code
- [ ] No sensitive data in public tables

---

### Post-Deployment

- [ ] Monitor RLS errors in logs
- [ ] Test admin functions in production (test accounts)
- [ ] Verify rate limits trigger correctly
- [ ] Check leaderboard only shows public catches
- [ ] Verify private catches not exposed in any view
- [ ] Test GDPR data export function
- [ ] Verify notification privacy (users only see own)

---

### Regular Audits

**Frequency**: Quarterly

**Checklist**:
- [ ] Review moderation_log for unusual admin activity
- [ ] Check for new RLS bypass attempts in logs
- [ ] Verify all admin users are still authorized
- [ ] Review rate limit configuration (adjust if needed)
- [ ] Test GDPR deletion process
- [ ] Update privacy policy if schema changed

---

## Incident Response

### Security Breach Protocol

1. **Detect**: Monitor logs, user reports
2. **Assess**: Determine scope (which data exposed?)
3. **Contain**: Disable affected accounts, revoke tokens
4. **Remediate**: Fix vulnerability, patch code
5. **Notify**: Inform affected users (GDPR requires notification within 72 hours)
6. **Review**: Post-mortem, update security policies

---

### Emergency Contacts

- **Supabase Support**: support@supabase.io
- **GDPR DPO**: (assign a Data Protection Officer)
- **Security Lead**: (assign team member)

---

## Conclusion

The ReelyRated V2 schema implements defense-in-depth security:

1. **RLS Policies**: Database-level access control
2. **Admin Functions**: Secure, audited privileged operations
3. **Rate Limiting**: Database-enforced abuse prevention
4. **Soft Deletes**: Preserve data for recovery and moderation
5. **Visibility Rules**: Flexible privacy controls

**Critical**: Always test RLS policies thoroughly. A single policy error can expose private data.

**Principle**: Trust but verify - even with RLS, validate data access at application level.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Schema Version**: V2 Complete
