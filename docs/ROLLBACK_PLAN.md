# Rollback Plan - ReelyRated V2 Database

## Overview

This document provides comprehensive procedures for rolling back the ReelyRated V2 database schema deployment in case of critical failures or issues discovered post-deployment.

**Critical**: Always take a backup before running any migration. Rollbacks are risky and may result in data loss.

---

## Table of Contents

1. [Pre-Deployment Backup Strategy](#pre-deployment-backup-strategy)
2. [Rollback Scenarios](#rollback-scenarios)
3. [Rollback Procedures](#rollback-procedures)
4. [Restore from Backup](#restore-from-backup)
5. [Reversible vs Irreversible Changes](#reversible-vs-irreversible-changes)
6. [Rollback Testing Procedures](#rollback-testing-procedures)
7. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Backup Strategy

**Golden Rule**: Never deploy without a backup.

### Step 1: Take Database Snapshot (Supabase Dashboard)

**For Supabase Users**:

1. Go to Supabase Dashboard → Database → Backups
2. Click "Create manual backup"
3. Name: `pre-v2-migration-YYYY-MM-DD-HH-MM`
4. Wait for backup to complete (usually 1-5 minutes)
5. Verify backup exists in list

**Retention**: Supabase retains backups for 7-30 days (depending on plan)

---

### Step 2: Export Database Dump (CLI)

**Recommended**: Create local backup using pg_dump

```bash
# Set your database connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Export schema + data
pg_dump $DATABASE_URL > backup-v1-schema-$(date +%Y%m%d-%H%M%S).sql

# Export schema only (for reference)
pg_dump $DATABASE_URL --schema-only > backup-v1-schema-only-$(date +%Y%m%d-%H%M%S).sql

# Export data only
pg_dump $DATABASE_URL --data-only > backup-v1-data-only-$(date +%Y%m%d-%H%M%S).sql
```

**Store Securely**:
- Upload to S3/Google Cloud Storage
- Store in encrypted backup location
- Keep local copy

---

### Step 3: Export Critical Tables Separately

**Export user-generated content**:

```bash
# Export profiles
psql $DATABASE_URL -c "COPY (SELECT * FROM profiles) TO STDOUT WITH CSV HEADER" > profiles-backup.csv

# Export catches
psql $DATABASE_URL -c "COPY (SELECT * FROM catches) TO STDOUT WITH CSV HEADER" > catches-backup.csv

# Export sessions
psql $DATABASE_URL -c "COPY (SELECT * FROM sessions) TO STDOUT WITH CSV HEADER" > sessions-backup.csv
```

**Purpose**: Quick restore of critical data without full database restore

---

### Step 4: Document Current State

**Take screenshots**:
- Database table list (Supabase Dashboard → Table Editor)
- Sample data from key tables
- Current row counts

**Record metrics**:
```sql
-- Save current row counts
SELECT
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'catches', COUNT(*) FROM catches
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'catch_comments', COUNT(*) FROM catch_comments;
```

**Save output** to file: `pre-migration-metrics.txt`

---

## Rollback Scenarios

### Scenario 1: Migration Fails Midway

**Symptoms**:
- SQL errors during migration
- Tables partially created
- Data corruption

**Severity**: Critical

**Action**: Full rollback required

---

### Scenario 2: Migration Succeeds but Frontend Breaks

**Symptoms**:
- 404 errors on API calls
- Permission denied errors
- Missing data in UI

**Severity**: High

**Action**: Rollback database OR fix frontend queries

---

### Scenario 3: Performance Degradation

**Symptoms**:
- Slow queries (> 5 seconds)
- High database CPU usage
- Timeout errors

**Severity**: Medium

**Action**: Optimize queries, add indexes, or rollback if critical

---

### Scenario 4: Data Loss Discovered

**Symptoms**:
- User reports missing catches
- Row counts don't match pre-migration
- Soft-deleted data incorrectly purged

**Severity**: Critical

**Action**: Restore from backup immediately

---

### Scenario 5: Security Vulnerability Discovered

**Symptoms**:
- RLS bypass discovered
- Unauthorized data access
- Admin function exploited

**Severity**: Critical

**Action**: Patch vulnerability OR rollback if patch unavailable

---

## Rollback Procedures

### Procedure 1: Rollback V2 Schema to V1 (Full Rollback)

**WARNING**: This will DELETE all V2 data. Use only if migration failed or V2 is unusable.

**Prerequisites**:
- [ ] V1 backup exists
- [ ] No critical V2-only data created
- [ ] Frontend can handle V1 schema

**Steps**:

#### Step 1: Put App in Maintenance Mode

**Frontend**: Display maintenance page to users

**Supabase**: No built-in maintenance mode - must handle in frontend

---

#### Step 2: Restore V1 Database from Backup

**Option A: Restore from Supabase Backup**

1. Go to Supabase Dashboard → Database → Backups
2. Find backup: `pre-v2-migration-YYYY-MM-DD-HH-MM`
3. Click "Restore"
4. Confirm restoration
5. Wait for restore to complete (5-15 minutes)
6. Verify tables restored: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`

**Option B: Restore from pg_dump**

```bash
# Connect to database
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Drop V2 schema (WARNING: Deletes all data!)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup file
psql $DATABASE_URL < backup-v1-schema-20250115-120000.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"
```

---

#### Step 3: Verify V1 Schema Restored

**Check tables exist**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected V1 tables**:
- profiles
- sessions
- catches
- water_types
- baits
- tags

**Should NOT see V2-only tables**:
- species
- venues
- catch_comments
- catch_reactions
- ratings
- profile_follows
- notifications
- reports
- admin_users
- user_warnings
- moderation_log
- rate_limits

---

#### Step 4: Verify Data Integrity

**Compare row counts** with pre-migration metrics:
```sql
SELECT
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'catches', COUNT(*) FROM catches
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions;
```

**Check sample data**:
```sql
SELECT * FROM profiles LIMIT 5;
SELECT * FROM catches LIMIT 5;
```

---

#### Step 5: Rollback Frontend to V1

**Git**:
```bash
# Revert to last V1 commit
git log --oneline  # Find V1 commit hash
git revert <v2-commit-hash>
git push origin main

# OR checkout V1 branch
git checkout v1-stable
git push origin main --force  # Danger: rewrites history
```

**Vercel/Netlify**:
- Redeploy from V1 branch
- OR rollback to previous deployment in dashboard

---

#### Step 6: Test Application

- [ ] Can sign in
- [ ] Can view catches
- [ ] Can create catch
- [ ] Can edit profile
- [ ] No console errors

---

#### Step 7: Remove Maintenance Mode

**Frontend**: Remove maintenance banner, enable normal operation

---

### Procedure 2: Partial Rollback (Rollback RPCs Only)

**Scenario**: V2 schema is fine, but RPC functions have bugs

**Steps**:

1. **Drop buggy RPC functions**:
```sql
DROP FUNCTION IF EXISTS admin_delete_catch CASCADE;
DROP FUNCTION IF EXISTS admin_restore_catch CASCADE;
DROP FUNCTION IF EXISTS admin_delete_comment CASCADE;
DROP FUNCTION IF EXISTS admin_restore_comment CASCADE;
DROP FUNCTION IF EXISTS admin_warn_user CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
DROP FUNCTION IF EXISTS get_rate_limit_status CASCADE;
DROP FUNCTION IF EXISTS cleanup_rate_limits CASCADE;
```

2. **Restore V1 RPC functions** (if they existed):
```bash
psql $DATABASE_URL < v1-rpc-functions-backup.sql
```

3. **OR disable buggy features**:
- Disable admin moderation UI
- Disable rate limiting (remove triggers)
- Use basic functionality only

---

### Procedure 3: Rollback Individual Tables

**Scenario**: Most of V2 is fine, but one table (e.g., `notifications`) has issues

**Steps**:

1. **Drop problematic table**:
```sql
DROP TABLE IF EXISTS notifications CASCADE;
```

2. **Recreate from V1 schema** (if applicable):
```sql
-- Run V1 table creation script
CREATE TABLE notifications (...);
```

3. **OR leave table disabled**:
- Frontend gracefully handles missing table
- Example: `notifications` returns empty array if table doesn't exist

---

### Procedure 4: Rollback RLS Policies

**Scenario**: RLS policy has security vulnerability

**Steps**:

1. **Disable RLS temporarily** (DANGER: Data exposed!):
```sql
ALTER TABLE catches DISABLE ROW LEVEL SECURITY;
```

**WARNING**: Only use in emergencies. Data is now unprotected.

2. **Drop vulnerable policy**:
```sql
DROP POLICY "Followers catches viewable by followers" ON catches;
```

3. **Recreate safe policy**:
```sql
CREATE POLICY "Followers catches viewable by followers"
ON catches FOR SELECT
USING (
  visibility = 'followers'
  AND deleted_at IS NULL
  AND (
    auth.uid() = user_id  -- Owner can see
    -- Removed vulnerable follower check
  )
);
```

4. **Re-enable RLS**:
```sql
ALTER TABLE catches ENABLE ROW LEVEL SECURITY;
```

---

## Restore from Backup

### When to Restore

**Immediate Restore Required**:
- Data loss detected (missing users, catches)
- Data corruption (nulled fields, wrong values)
- Accidental deletion (e.g., admin deleted wrong catch)

**Restore Not Required**:
- Performance issues (optimize instead)
- Frontend bugs (fix frontend, not database)
- Minor feature bugs (patch instead)

---

### Full Database Restore

#### Method 1: Supabase Dashboard Restore

**Steps**:

1. Go to Supabase Dashboard → Database → Backups
2. Find desired backup (e.g., `pre-v2-migration-YYYY-MM-DD`)
3. Click "Restore"
4. **WARNING**: This will overwrite current database
5. Confirm restoration
6. Wait for completion (5-30 minutes depending on database size)
7. Refresh page and verify tables restored

**Downtime**: 5-30 minutes (app is down during restore)

**Data Loss**: All changes since backup are lost

---

#### Method 2: pg_restore from Dump

**Steps**:

1. **Drop current database** (WARNING!):
```bash
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO anon; GRANT ALL ON SCHEMA public TO authenticated;"
```

2. **Restore from dump**:
```bash
psql $DATABASE_URL < backup-v1-schema-20250115-120000.sql
```

3. **Verify restoration**:
```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

4. **Grant permissions** (if needed):
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
```

---

### Partial Data Restore

**Scenario**: Only restore specific tables (e.g., `profiles`)

**Steps**:

1. **Export table from backup**:
```bash
# Restore backup to temporary database
pg_restore -d temp_db backup-v1-schema.dump

# Export specific table
pg_dump temp_db -t profiles > profiles-backup.sql
```

2. **Truncate current table**:
```sql
TRUNCATE TABLE profiles CASCADE;  -- WARNING: Deletes all rows
```

3. **Import from backup**:
```bash
psql $DATABASE_URL < profiles-backup.sql
```

4. **Verify**:
```sql
SELECT COUNT(*) FROM profiles;
SELECT * FROM profiles LIMIT 5;
```

---

### Point-in-Time Recovery (Supabase Pro/Enterprise)

**Supabase Pro/Enterprise**: Supports point-in-time recovery (PITR)

**Steps**:

1. Go to Supabase Dashboard → Database → Backups
2. Select "Point-in-time recovery"
3. Choose timestamp (e.g., "1 hour ago")
4. Confirm restoration
5. Database restored to that exact moment

**Use Case**: Undo accidental deletion or corruption from specific time

---

## Reversible vs Irreversible Changes

### Reversible Changes (Can Be Undone)

| Change | How to Reverse |
|--------|----------------|
| Add table | `DROP TABLE table_name;` |
| Add column | `ALTER TABLE table_name DROP COLUMN column_name;` |
| Add index | `DROP INDEX index_name;` |
| Add RLS policy | `DROP POLICY policy_name ON table_name;` |
| Add RPC function | `DROP FUNCTION function_name;` |
| Add trigger | `DROP TRIGGER trigger_name ON table_name;` |
| Add enum value | Cannot remove (PostgreSQL limitation) - create new enum |
| Insert seed data | `DELETE FROM table_name WHERE condition;` |

---

### Irreversible Changes (Cannot Be Undone)

| Change | Why Irreversible | Mitigation |
|--------|------------------|------------|
| `DROP TABLE` | Data permanently deleted | Restore from backup |
| `TRUNCATE TABLE` | All rows deleted | Restore from backup |
| `DELETE` without WHERE | All rows deleted | Restore from backup, use soft delete instead |
| `UPDATE` without WHERE | All rows modified | Restore from backup, test in staging first |
| Hard delete (no soft delete) | No recovery mechanism | Always use soft delete for user data |
| Enum value removal | PostgreSQL doesn't support | Create new enum type |

---

### Semi-Reversible Changes (Can Be Undone with Data Loss)

| Change | Reversibility | Data Loss Risk |
|--------|---------------|----------------|
| Rename column | Reversible via `ALTER TABLE ... RENAME` | None if reversed quickly |
| Change column type | Reversible if compatible (e.g., TEXT → VARCHAR) | High if incompatible (e.g., INT → TEXT) |
| Add NOT NULL constraint | Reversible via `ALTER TABLE ... DROP CONSTRAINT` | None, but may cause app errors |
| Remove column | Irreversible (data lost) | High - restore from backup |
| Change FK constraint | Reversible (drop, recreate) | None |

---

## Rollback Testing Procedures

**Golden Rule**: Test rollback BEFORE production deployment.

### Test Environment Setup

1. **Create test database** (separate from production):
```bash
# Create test Supabase project OR local Postgres
docker run -d --name postgres-test -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:14
```

2. **Populate with test data**:
```bash
psql postgresql://postgres:test@localhost:5433/postgres < seed-v1.sql
```

---

### Rollback Test Procedure

**Objective**: Verify rollback works before production deployment

**Steps**:

1. **Deploy V2 schema to test database**:
```bash
psql postgresql://postgres:test@localhost:5433/postgres < 20251115_v2_complete_schema.sql
psql postgresql://postgres:test@localhost:5433/postgres < 20251115_v2_rpc_functions.sql
```

2. **Verify V2 deployment**:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Should see V2 tables
```

3. **Take backup**:
```bash
pg_dump postgresql://postgres:test@localhost:5433/postgres > test-v2-backup.sql
```

4. **Simulate rollback** (follow Procedure 1 above):
```bash
psql postgresql://postgres:test@localhost:5433/postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql postgresql://postgres:test@localhost:5433/postgres < backup-v1-schema.sql
```

5. **Verify rollback successful**:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Should see V1 tables only
```

6. **Verify data integrity**:
```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM catches;
-- Should match pre-migration counts
```

---

### Rollback Success Criteria

- [ ] V1 schema restored (correct tables exist)
- [ ] Row counts match pre-migration metrics
- [ ] Sample queries return expected data
- [ ] No errors when querying tables
- [ ] Frontend loads without errors (if tested with app)
- [ ] Users can sign in and view catches

---

### Rollback Failure Scenarios

**If rollback fails**:

1. **Restore from earlier backup**:
   - Use backup taken before V2 migration
   - May lose more data, but guaranteed working state

2. **Manual data recovery**:
   - Import individual tables from CSV exports
   - Time-consuming but preserves critical data

3. **Contact Supabase support**:
   - support@supabase.io
   - Provide project ID and backup timestamp
   - They may be able to restore from their backups

---

## Emergency Rollback Playbook

**Use this checklist during a production emergency**

### Phase 1: Assess Severity (5 minutes)

- [ ] Determine impact: How many users affected?
- [ ] Determine urgency: Is data being lost right now?
- [ ] Determine root cause: Migration bug? Frontend bug? RLS bug?

**Decision**:
- **Critical (data loss, security breach)**: Proceed to immediate rollback
- **High (app broken but no data loss)**: Attempt quick fix first, rollback if fix unavailable in 30 min
- **Medium (performance degradation)**: Monitor, optimize, rollback only if critical

---

### Phase 2: Communication (2 minutes)

- [ ] Notify team (Slack, email)
- [ ] Post status update (e.g., Twitter, status page)
- [ ] Example: "We're experiencing technical issues. Investigating..."

---

### Phase 3: Execute Rollback (15-30 minutes)

- [ ] Put app in maintenance mode
- [ ] Follow **Procedure 1: Full Rollback** (see above)
- [ ] Verify restoration successful
- [ ] Test critical flows (sign in, view catches)

---

### Phase 4: Re-enable App (5 minutes)

- [ ] Remove maintenance mode
- [ ] Monitor error logs
- [ ] Post update: "Issues resolved. App is back online."

---

### Phase 5: Post-Mortem (within 24 hours)

- [ ] Document what went wrong
- [ ] Document what was done to fix it
- [ ] Identify preventive measures
- [ ] Update rollback plan based on learnings

**Template**:
```
## Post-Mortem: V2 Migration Rollback

**Date**: 2025-01-15
**Duration**: 45 minutes downtime
**Root Cause**: RLS policy allowed data exposure
**Impact**: 50 users saw private catches
**Resolution**: Rolled back to V1, fixed RLS policy in staging
**Prevention**: Add RLS policy tests to CI/CD pipeline
```

---

## Emergency Contacts

### Internal Team

- **Database Lead**: [Name] - [Email] - [Phone]
- **DevOps Lead**: [Name] - [Email] - [Phone]
- **CTO/Technical Lead**: [Name] - [Email] - [Phone]

---

### External Support

- **Supabase Support**: support@supabase.io
- **Supabase Status Page**: https://status.supabase.com
- **Supabase Discord**: https://discord.supabase.com (for urgent issues)

---

### Escalation Path

1. **Developer detects issue** → Notify Database Lead
2. **Database Lead** → Assess severity → Decide on rollback
3. **If rollback needed** → Notify CTO → Execute rollback
4. **If rollback fails** → Contact Supabase Support
5. **Post-rollback** → Notify users → Conduct post-mortem

---

## Rollback Checklist Summary

**Before Deployment**:
- [ ] Take Supabase backup
- [ ] Export pg_dump backup
- [ ] Export critical tables to CSV
- [ ] Document current row counts
- [ ] Test rollback in staging environment

**During Rollback**:
- [ ] Put app in maintenance mode
- [ ] Execute rollback procedure
- [ ] Verify data integrity
- [ ] Test critical flows
- [ ] Remove maintenance mode

**After Rollback**:
- [ ] Monitor error logs
- [ ] Notify users of resolution
- [ ] Conduct post-mortem
- [ ] Fix root cause in staging
- [ ] Re-test before next deployment attempt

---

## Best Practices

1. **Always backup before deploy**: No backup = no safety net
2. **Test rollback in staging**: Practice makes perfect
3. **Communicate proactively**: Users appreciate transparency
4. **Document everything**: Future you will thank you
5. **Learn from failures**: Update this plan after each incident
6. **Use soft deletes**: Makes rollback easier (data not lost)
7. **Monitor actively**: Catch issues before users report them
8. **Have a maintenance mode**: Users prefer a message over a broken app

---

## Conclusion

Rollbacks are risky but sometimes necessary. This plan provides step-by-step procedures to minimize downtime and data loss.

**Key Principles**:
1. Backup before every deployment
2. Test rollback procedures in staging
3. Act quickly but carefully during emergencies
4. Learn from incidents to prevent recurrence

**Remember**: The best rollback is the one you never have to execute. Thorough testing and gradual rollout reduce rollback risk.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Schema Version**: V2 Complete
