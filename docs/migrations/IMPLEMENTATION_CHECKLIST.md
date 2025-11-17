# Schema Migration Implementation Checklist

## Pre-Migration

### Database Preparation
- [ ] Create full backup of production database
- [ ] Create staging/test environment
- [ ] Verify backup restoration works
- [ ] Document current database size/performance metrics
- [ ] Plan rollback procedure

### Code Preparation
- [ ] Create feature branch for migration work
- [ ] Review all 6 PATCH files
- [ ] Identify any additional files not covered
- [ ] Plan testing strategy
- [ ] Set up monitoring/logging

## Database Migration (CRITICAL)

### Step 1: Schema Migration
- [ ] Review migration SQL: `supabase/migrations/20251116000000_v2_complete_rebuild.sql`
- [ ] Run migration on staging database
- [ ] Verify all tables created
- [ ] Verify all columns exist
- [ ] Check ENUM types created
- [ ] Verify indexes created
- [ ] Test foreign key constraints

### Step 2: RPC Functions
- [ ] Review RPC SQL: `supabase/migrations/20251116000001_v2_rpc_functions.sql`
- [ ] Deploy all RPC functions to staging
- [ ] Test `create_notification` function
- [ ] Test `admin_delete_catch` function
- [ ] Test `admin_delete_comment` function
- [ ] Test `admin_restore_catch` function
- [ ] Test `admin_restore_comment` function
- [ ] Test `admin_warn_user` function
- [ ] Verify RPC security (SECURITY DEFINER)

### Step 3: Data Validation
- [ ] Verify existing profiles have `user_id` populated
- [ ] Check for any `deleted_at` values in existing data
- [ ] Verify foreign key relationships intact
- [ ] Test queries with new field names
- [ ] Verify CITEXT fields work correctly

## Code Updates (By Patch File)

### PATCH 01: Auth & Profiles ✅
**Status:** NO CHANGES REQUIRED
- [x] Verified `user_id` usage in `src/lib/profile.ts`
- [x] Verified `user_id` usage in `src/hooks/useProfile.ts`

### PATCH 02: Catches & Feed
- [ ] Update `src/lib/catches.ts`
  - [ ] Change SELECT field names (species, location, method)
  - [ ] Add `deleted_at IS NULL` filter
  - [ ] Update TypeScript types to use Database schema
  - [ ] Add new fields to query (gallery_photos, video_url, etc.)
- [ ] Update `src/hooks/useCatches.ts`
  - [ ] Change SELECT field names
  - [ ] Add `deleted_at IS NULL` filter
  - [ ] Update CatchRow interface
- [ ] Test catch loading
- [ ] Test feed display
- [ ] Test catch creation

### PATCH 03: Search & Discovery
- [ ] Identify all search/filter components
- [ ] Update species filtering logic
- [ ] Update location filtering logic
- [ ] Update method/bait filtering logic
- [ ] Create species catalog filter component
- [ ] Create location filter component
- [ ] Create method/tag filter component
- [ ] Test combined filters
- [ ] Test case-insensitive search

### PATCH 04: Sessions & Insights
- [ ] Update `src/pages/Sessions.tsx`
  - [ ] Change SessionRow interface to use Database type
  - [ ] Update SELECT query fields
  - [ ] Change `venue` → `venue_name_manual` in display
  - [ ] Add `deleted_at IS NULL` filter
- [ ] Update `src/pages/Insights.tsx`
  - [ ] Update catches SELECT query
  - [ ] Update sessions SELECT query
  - [ ] Update venue extraction logic
  - [ ] Add `deleted_at` filters
- [ ] Update `src/lib/insights-utils.ts`
  - [ ] Update CatchRow type definition
  - [ ] Add helper functions for new fields
- [ ] Update `src/lib/insights-aggregation.ts`
  - [ ] Change field access patterns (species, location, method)
- [ ] Test session display
- [ ] Test insights calculations
- [ ] Test charts rendering

### PATCH 05: Notifications
- [ ] Update `src/lib/notifications.ts`
  - [ ] Add `actorId` to NotificationPayload
  - [ ] Update RPC call parameters
  - [ ] Update `notifyAdmins` signature
  - [ ] Update type imports
- [ ] Identify notification display components
- [ ] Update notification display to use new fields
  - [ ] Change `data.message` → `message`
  - [ ] Change `data.catchId` → `catch_id`
  - [ ] Add `actor_id` support
- [ ] Test notification creation
- [ ] Test notification display
- [ ] Test admin notifications

### PATCH 06: Admin & Moderation
- [ ] Update `src/pages/AdminReports.tsx`
  - [ ] Update type definitions to use Database types
  - [ ] Update reports SELECT query
  - [ ] Change `profiles.id` → `profiles.user_id`
  - [ ] Change `admin.id` → `admin.user_id` in displays
  - [ ] Change `reporter.id` → `reporter.user_id`
  - [ ] Update user_warnings query
  - [ ] Update moderation_log query
- [ ] Update `src/lib/admin.ts`
  - [ ] Review admin check logic
  - [ ] Add granted_by tracking (optional)
- [ ] Test report viewing
- [ ] Test content deletion (soft delete)
- [ ] Test content restoration
- [ ] Test user warnings
- [ ] Test moderation logs

## Component Updates

### Catch Display Components
- [ ] Update catch card component
- [ ] Update catch detail page
- [ ] Handle species display (slug vs custom)
- [ ] Handle location display (label vs normalized)
- [ ] Add gallery photos support
- [ ] Add video support
- [ ] Add tags display
- [ ] Add length display

### Session Display Components
- [ ] Update session card component
- [ ] Update session detail view
- [ ] Change venue field access
- [ ] Test catch count aggregation

### Notification Components
- [ ] Update notification item component
- [ ] Update notification list
- [ ] Add actor display
- [ ] Update click handlers for new field structure

### Admin Components
- [ ] Update admin dashboard
- [ ] Update report item component
- [ ] Update warning form
- [ ] Update moderation history display

## Testing

### Unit Tests
- [ ] Test catch query builders
- [ ] Test session query builders
- [ ] Test notification creation
- [ ] Test admin functions
- [ ] Test filter logic
- [ ] Test type safety

### Integration Tests
- [ ] Test catch CRUD operations
- [ ] Test session CRUD operations
- [ ] Test notification flow end-to-end
- [ ] Test report creation and resolution
- [ ] Test soft delete and restore
- [ ] Test user warnings

### E2E Tests
- [ ] User can create catch with all new fields
- [ ] User can view feed with filters
- [ ] User can view sessions
- [ ] User can view insights
- [ ] User receives notifications
- [ ] Admin can moderate content
- [ ] Admin can warn users

### Performance Tests
- [ ] Feed loading time (with deleted_at filter)
- [ ] Search/filter performance
- [ ] Insights calculation time
- [ ] Leaderboard query performance
- [ ] Check query plans for indexes

## Data Migration (If Needed)

### Existing Data Updates
- [ ] Map old species values to species_slug
- [ ] Normalize existing locations
- [ ] Map old methods to method_tags
- [ ] Set default visibility for existing catches
- [ ] Set allow_ratings for existing catches

### Catalog Population
- [ ] Populate species catalog (common UK species)
- [ ] Populate tags/methods catalog
- [ ] Populate water_types catalog
- [ ] Populate baits catalog (optional)
- [ ] Populate venues catalog (optional)

## Deployment

### Pre-Deployment
- [ ] Code review all changes
- [ ] Merge feature branch to staging
- [ ] Deploy to staging environment
- [ ] Run full test suite on staging
- [ ] Performance test on staging
- [ ] Get stakeholder approval

### Production Deployment
- [ ] Schedule maintenance window
- [ ] Notify users of downtime (if any)
- [ ] Final backup of production DB
- [ ] Deploy database migrations
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Verify deployment successful
- [ ] Run smoke tests
- [ ] Monitor error logs
- [ ] Monitor performance metrics

### Post-Deployment
- [ ] Verify all features working
- [ ] Check for error spikes
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Gather user feedback
- [ ] Document any issues
- [ ] Plan follow-up improvements

## Rollback Plan

### If Critical Issues Found
- [ ] Stop new deployments
- [ ] Assess severity
- [ ] Restore database from backup (if needed)
- [ ] Revert code deployment
- [ ] Notify stakeholders
- [ ] Document root cause
- [ ] Plan remediation

## Documentation

### Code Documentation
- [ ] Update README with schema changes
- [ ] Document new field usage patterns
- [ ] Update API documentation
- [ ] Add migration guide for developers
- [ ] Document catalog tables

### User Documentation
- [ ] Update user guide (if public)
- [ ] Document new features
- [ ] Create release notes
- [ ] Update FAQ

## Cleanup

### Post-Migration Cleanup
- [ ] Remove deprecated code paths
- [ ] Remove old field access patterns
- [ ] Update stale comments
- [ ] Archive old migration files
- [ ] Update type definitions

## Success Verification

### Feature Verification
- [x] Profile loading works
- [ ] Catch creation works
- [ ] Catch display works
- [ ] Feed filtering works
- [ ] Session management works
- [ ] Insights display works
- [ ] Notifications work
- [ ] Admin moderation works
- [ ] Search/discovery works
- [ ] Soft delete works correctly

### Performance Verification
- [ ] Feed loads within acceptable time
- [ ] Search responds quickly
- [ ] Insights calculate efficiently
- [ ] Database not overloaded
- [ ] No N+1 query problems

### Data Integrity Verification
- [ ] No deleted content showing in feed
- [ ] All foreign keys valid
- [ ] All ENUM values valid
- [ ] No orphaned records
- [ ] Soft delete reversible

## Priority Order for Implementation

### Phase 1 (CRITICAL - Must Complete First)
1. Database schema migration
2. RPC functions deployment
3. PATCH 02: Catches & Feed updates
4. PATCH 04: Sessions & Insights updates

### Phase 2 (HIGH - Complete Next)
5. PATCH 05: Notifications updates
6. PATCH 06: Admin & Moderation updates
7. Component display updates

### Phase 3 (MEDIUM - Follow-up)
8. PATCH 03: Search & Discovery enhancements
9. Catalog population
10. Advanced features

### Phase 4 (LOW - Optional Enhancements)
11. Performance optimizations
12. UI/UX improvements
13. Documentation updates
14. Analytics/monitoring

---

## Notes

- **DO NOT SKIP** soft delete filters - this is a critical security/privacy issue
- **TEST THOROUGHLY** on staging before production deployment
- **BACKUP EVERYTHING** before starting migration
- **MONITOR CLOSELY** after deployment for issues
- **COMMUNICATE** with team throughout process

---

**Last Updated:** 2025-11-16
**Status:** Ready for Implementation
