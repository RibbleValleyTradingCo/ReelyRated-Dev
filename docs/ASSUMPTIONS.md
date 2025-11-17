# Technical Assumptions & Design Decisions - ReelyRated V2

## Overview

This document captures all technical assumptions, design trade-offs, known limitations, and future enhancement opportunities for the ReelyRated V2 database schema rebuild.

**Purpose**: Ensure transparency in decision-making and provide context for future developers maintaining this system.

---

## Table of Contents

1. [Technical Assumptions](#technical-assumptions)
2. [Design Trade-offs & Rationale](#design-trade-offs--rationale)
3. [Known Limitations](#known-limitations)
4. [Future Enhancement Opportunities](#future-enhancement-opportunities)
5. [Dependencies on External Systems](#dependencies-on-external-systems)
6. [Data Migration Assumptions](#data-migration-assumptions)
7. [Performance Assumptions](#performance-assumptions)
8. [Security Assumptions](#security-assumptions)

---

## Technical Assumptions

### Database & Infrastructure

#### 1. PostgreSQL Version
**Assumption**: Using PostgreSQL 14+ (Supabase default)

**Rationale**: Relies on features like:
- JSONB with advanced operators
- Materialized views with CONCURRENTLY
- Generated columns (if needed)
- Improved indexing performance

**Risk**: Downgrading to older Postgres versions may break features

---

#### 2. Supabase Hosting
**Assumption**: Database hosted on Supabase with all Supabase services available

**Dependencies**:
- Supabase Auth for user management
- Supabase Storage for image hosting
- Supabase Realtime for live updates
- Supabase Edge Functions (optional)

**Risk**: Migrating away from Supabase requires:
- Reimplementing auth system
- Migrating storage to S3/CloudFlare
- Replacing realtime with WebSockets/Pusher

---

#### 3. Service Role Key Protection
**Assumption**: Service role key is stored securely (env vars, secrets manager)

**Critical**: Service role bypasses RLS - must never be exposed to client

**Risk**: If leaked, entire database is compromised

---

### Authentication & Users

#### 4. Single Auth Provider
**Assumption**: Supabase Auth is the sole authentication provider

**Current**: Email/password signup

**Future**: Could add OAuth (Google, Facebook) - `auth.users` table supports this

**Risk**: Supabase Auth outage = app outage

---

#### 5. User ID is UUID
**Assumption**: `auth.users.id` is UUID format and globally unique

**Usage**: All foreign keys to users use UUID type

**Risk**: Changing to integer IDs would require schema migration

---

#### 6. One Profile Per User
**Assumption**: 1:1 relationship between `auth.users` and `profiles`

**Rationale**: Simplifies permissions (no multi-tenant accounts)

**Future**: Could support organization accounts with multiple users

---

### Data Model Assumptions

#### 7. Species Catalog is Pre-Populated
**Assumption**: Common fish species are pre-loaded in `species` table

**Current**: 8 species (Mirror Carp, Common Carp, Pike, Perch, Roach, Bream, Tench, Barbel)

**Fallback**: Users can use `custom_species` TEXT field for unlisted species

**Trade-off**: Pre-populated catalog vs user-generated tags
- **Chose**: Pre-populated for consistency and filtering
- **Alternative**: User-generated tags (harder to filter, typos, duplicates)

---

#### 8. Venue Catalog is Pre-Populated
**Assumption**: Popular fishing venues are pre-loaded in `venues` table

**Current**: 3 venues (Linear Fisheries, Wraysbury River, Blenheim Palace)

**Fallback**: Users can use `venue_name_manual` TEXT field

**Future**: Allow users to submit new venues for admin approval

---

#### 9. Species Slug for Filtering
**Assumption**: `species_slug` (e.g., "mirror_carp") is stored on catches for fast filtering

**Rationale**: Avoid JOIN on species table for every leaderboard query

**Trade-off**: Denormalization vs performance
- **Chose**: Denormalize species_slug
- **Alternative**: Always JOIN species table (slower at scale)

**Consistency**: `species_slug` must match `species.slug` - enforced via FK trigger

---

#### 10. Normalized Location for Search
**Assumption**: `normalized_location` (lowercase) is auto-populated via trigger

**Purpose**: Case-insensitive location search without `ILIKE`

**Rationale**: `ILIKE` is slow on large tables - `normalized_location` index is faster

**Trade-off**: Storage (extra column) vs query performance
- **Chose**: Extra storage for faster search

---

#### 11. Soft Delete by Default
**Assumption**: Catches, sessions, and comments use soft delete (`deleted_at`)

**Rationale**:
- Users can undo deletion
- Admins can review deleted content for moderation
- Preserve referential integrity

**Trade-off**: Database bloat vs recoverability
- **Chose**: Soft delete for user experience
- **Mitigation**: Purge soft-deleted records after 30 days (future cron job)

---

#### 12. Reactions Have No Soft Delete
**Assumption**: Reactions, ratings, and follows are hard-deleted

**Rationale**: Lightweight actions with no content - soft delete not needed

**Trade-off**: No undo for reactions
- **Acceptable**: Users can re-react easily

---

#### 13. JSONB for Extensible Data
**Assumption**: `catches.conditions` uses JSONB for flexibility

**Examples**: Weather, wind, temperature, moon phase, barometric pressure

**Rationale**: Fishing conditions vary widely - JSONB allows adding fields without schema migration

**Trade-off**: Unstructured data vs schema flexibility
- **Chose**: JSONB for extensibility
- **Risk**: Frontend must handle missing/unexpected fields

---

### Social Features

#### 14. Public Profiles by Default
**Assumption**: All user profiles are publicly viewable

**Rationale**: Social discovery requires public profiles

**Future**: Add "private profile" option (only followers can see)

---

#### 15. Three Visibility Levels
**Assumption**: Catches have 3 visibility levels: public, followers, private

**Rationale**: Balances sharing with privacy

**Trade-off**: Complexity in RLS policies vs granular control
- **Chose**: 3 levels (good enough for most use cases)
- **Alternative**: More granular (e.g., "friends only", "unlisted") - too complex for V1

---

#### 16. No Direct Messaging (DMs)
**Assumption**: No DM/chat feature in V2 schema

**Rationale**: Out of scope for initial launch

**Future**: Add `messages` table with threading

---

#### 17. Notifications Not Real-Time (Database-Only)
**Assumption**: Notifications stored in database, displayed on next page load

**Current**: No push notifications, no email notifications

**Future**: Integrate with:
- Supabase Realtime for instant notifications
- Email service (SendGrid, Postmark) for digest emails
- Push notifications (Firebase Cloud Messaging)

---

### Moderation & Admin

#### 18. Admin Users List is Manual
**Assumption**: Admins are manually added to `admin_users` table

**Process**: INSERT admin user IDs via SQL or admin dashboard

**Future**: Admin invitation system with roles (moderator, admin, super admin)

---

#### 19. Single Admin Role
**Assumption**: All admins have equal permissions

**Trade-off**: Simplicity vs granular permissions
- **Chose**: Single role for V2
- **Future**: Add roles (moderator, admin, super admin) with different capabilities

---

#### 20. Moderation is Reactive (Not Proactive)
**Assumption**: Content is not pre-moderated - users can post immediately

**Process**: Users report content → admins review → admins take action

**Trade-off**: User experience vs safety
- **Chose**: Reactive moderation (faster user onboarding)
- **Risk**: Inappropriate content may be visible before removal
- **Mitigation**: Active admin team, rate limiting

---

#### 21. No Automated Content Filtering
**Assumption**: No profanity filter, no image moderation (e.g., NSFW detection)

**Future**: Integrate services like:
- AWS Rekognition (image moderation)
- Perspective API (text toxicity)
- Custom profanity filter

---

### Rate Limiting

#### 22. Rate Limits are Database-Enforced
**Assumption**: Rate limits enforced via triggers (database-side)

**Rationale**: Cannot be bypassed by client manipulation

**Trade-off**: Database load vs security
- **Chose**: Database enforcement (more secure)
- **Alternative**: API gateway rate limiting (less secure, easier to scale)

**Current Limits**:
- 10 catches per hour
- 30 comments per hour
- 5 reports per hour

**Assumption**: These limits are sufficient for normal users

**Risk**: Power users may hit limits - need monitoring and adjustment

---

#### 23. Rate Limits Apply Per User
**Assumption**: Rate limits are per user_id, not per IP

**Rationale**: User-based limits are more fair (multiple users on same IP)

**Risk**: User can create multiple accounts to bypass

**Mitigation**: Add IP-based rate limiting at API gateway level (future)

---

### Search & Discovery

#### 24. Search Uses ILIKE (Not Full-Text Search)
**Assumption**: Search is implemented with `ILIKE '%keyword%'`

**Rationale**: Simple, no additional setup required

**Limitations**:
- Slow on large tables (millions of rows)
- No fuzzy matching
- No relevance ranking

**Future**: Upgrade to PostgreSQL full-text search (tsvector, tsquery) or external service (Algolia, Meilisearch)

---

#### 25. No Autocomplete/Suggestions
**Assumption**: Search does not provide autocomplete or suggested results

**Future**: Add autocomplete for:
- Usernames
- Species names
- Venue names

---

### Leaderboards & Scoring

#### 26. Leaderboard Scoring Formula
**Assumption**: Total score = `weight + (avg_rating * 5) + (reaction_count * 0.5)`

**Rationale**: Balances catch size, community engagement, and ratings

**Tunable**: Coefficients can be adjusted:
- Weight: 1x (direct value)
- Rating: 5x (rating of 10 → +50 points)
- Reaction: 0.5x (10 reactions → +5 points)

**Trade-off**: Simplicity vs fairness
- **Chose**: Simple formula (easy to understand)
- **Risk**: May favor large fish over rare species
- **Future**: Species-specific leaderboards, seasonal leaderboards

---

#### 27. Materialized View for Performance
**Assumption**: Leaderboard uses materialized view (refreshed periodically)

**Trade-off**: Real-time accuracy vs performance
- **Chose**: Materialized view (faster queries)
- **Staleness**: Leaderboard may be outdated by a few minutes
- **Alternative**: Regular view (real-time but slower)

**Refresh Schedule**: Manual or cron job (daily at 2am recommended)

---

#### 28. Only Public Catches in Leaderboard
**Assumption**: Leaderboard only includes public catches

**Rationale**: Leaderboards are public-facing - private catches should not be ranked

**RLS**: View filters `visibility = 'public'`

---

### Analytics & Insights

#### 29. Insights are User-Scoped
**Assumption**: Insights page shows only the logged-in user's catches

**Future**: Add global insights (e.g., "most popular venue this month")

---

#### 30. No Real-Time Analytics
**Assumption**: Insights are computed on-demand (query DB when page loads)

**Trade-off**: Real-time freshness vs pre-computed performance
- **Chose**: On-demand (simpler, good enough for low traffic)
- **Future**: Pre-compute insights daily, cache results

---

#### 31. No Data Export (Yet)
**Assumption**: Users cannot export insights to CSV/PDF

**Future**: Add export buttons using server-side rendering or Edge Functions

---

### Images & Media

#### 32. Images Hosted on Supabase Storage
**Assumption**: All catch images uploaded to Supabase Storage `catches` bucket

**Bucket Policy**: Public read access for public catches, authenticated for followers/private

**Limitations**:
- No image optimization (thumbnails, WebP conversion)
- No CDN integration (beyond Supabase CDN)

**Future**: Integrate with Cloudflare Images or imgix for optimization

---

#### 33. No Video Support (Yet)
**Assumption**: Users cannot upload videos

**Workaround**: `catches.video_urls` TEXT[] for external links (YouTube, Vimeo)

**Future**: Add video hosting (Supabase Storage or Mux)

---

#### 34. No Image Metadata Extraction
**Assumption**: GPS coordinates, EXIF data not extracted from uploaded images

**Future**: Extract metadata for:
- GPS coordinates (auto-populate location)
- Timestamp (verify caught_at)
- Camera model (catch verification)

---

### Geolocation & Maps

#### 35. Coordinates Stored but Not Required
**Assumption**: Venues have optional `latitude` and `longitude`

**Current**: No automatic geocoding (admin manually enters coordinates)

**Future**: Integrate geocoding API (Google Maps, Mapbox) to auto-fill coordinates from address

---

#### 36. Maps Rendered on Frontend
**Assumption**: Map display is frontend responsibility (Leaflet, Mapbox, Google Maps)

**Database**: Only stores lat/lng coordinates

---

#### 37. No Geospatial Queries (Yet)
**Assumption**: No "catches near me" or "venues within 10 miles" queries

**Future**: Use PostGIS extension for geospatial queries:
```sql
SELECT * FROM venues
WHERE ST_DWithin(
  ST_MakePoint(longitude, latitude)::geography,
  ST_MakePoint(-0.1276, 51.5074)::geography,
  16000  -- 10 miles in meters
);
```

---

## Design Trade-offs & Rationale

### 1. Denormalization vs Normalization

**Decision**: Denormalize `species_slug` on catches table

**Rationale**:
- Leaderboard queries are frequent and performance-critical
- JOINing species table on every query is costly at scale
- Species data rarely changes (safe to denormalize)

**Trade-off**: Storage cost (extra column) vs query performance

**Alternative Considered**: Always JOIN species table
- **Rejected**: Too slow for leaderboards with thousands of catches

---

### 2. Soft Delete vs Hard Delete

**Decision**: Soft delete for catches, sessions, comments

**Rationale**:
- Users expect to undo deletions
- Admins need to review deleted content for moderation
- Preserve data for analytics (e.g., "catches per month including deleted")

**Trade-off**: Database bloat vs recoverability

**Mitigation**: Purge soft-deleted records after retention period (30 days)

---

### 3. Materialized View vs Regular View

**Decision**: Materialized view for leaderboard

**Rationale**:
- Leaderboard queries are expensive (JOINs, aggregates, sorting)
- Real-time accuracy not critical (5-minute staleness acceptable)
- Materialized view can be indexed for faster lookups

**Trade-off**: Staleness vs performance

**Alternative Considered**: Regular view
- **Rejected**: Too slow for homepage hero spotlight (every page load)

---

### 4. Database Rate Limiting vs API Gateway

**Decision**: Database-enforced rate limiting (triggers)

**Rationale**:
- Cannot be bypassed by client manipulation
- Single source of truth (no sync issues)
- Works even if API gateway bypassed

**Trade-off**: Database load vs security

**Future**: Add API gateway rate limiting as second layer

---

### 5. Three Visibility Levels vs More Granular

**Decision**: 3 levels (public, followers, private)

**Rationale**:
- Covers 95% of use cases
- Simple for users to understand
- Manageable RLS policy complexity

**Trade-off**: Simplicity vs flexibility

**Alternative Considered**: More levels (friends, unlisted, etc.)
- **Rejected**: Too complex for initial launch

---

### 6. No Full-Text Search in V2

**Decision**: Use ILIKE for search

**Rationale**:
- Simple to implement
- No setup required (no tsvector columns, triggers)
- Good enough for early-stage product (< 100k catches)

**Trade-off**: Performance at scale vs simplicity

**Future**: Upgrade to PostgreSQL full-text search or Algolia when needed

---

### 7. Manual Admin Management

**Decision**: Admins manually added to `admin_users` table

**Rationale**:
- Low admin count (< 10)
- No need for complex RBAC in V2
- Reduces attack surface (no admin signup flow)

**Trade-off**: Manual overhead vs security

**Future**: Admin invitation system

---

### 8. No Pre-Moderation

**Decision**: Reactive moderation (users post immediately, admins review reports)

**Rationale**:
- Better user experience (no approval delay)
- Fishing community is generally positive
- Rate limiting reduces spam risk

**Trade-off**: Safety vs user experience

**Mitigation**: Active admin team, fast response to reports

---

## Known Limitations

### Performance Limitations

#### 1. ILIKE Search is Slow at Scale
**Limitation**: `WHERE title ILIKE '%pike%'` doesn't use indexes efficiently

**Impact**: Search becomes slow with > 100k catches

**Mitigation**: Add PostgreSQL full-text search (tsvector, GIN index)

**Workaround**: Limit search results to 100 rows

---

#### 2. Leaderboard Materialized View Must Be Refreshed
**Limitation**: Leaderboard is not real-time

**Impact**: New catches don't appear in leaderboard until refresh

**Frequency**: Manual refresh or daily cron job

**Workaround**: Use regular view for "latest catches" section (real-time)

---

#### 3. No Pagination on Leaderboard
**Limitation**: Leaderboard view returns all rows (not paginated)

**Impact**: Large result sets may be slow to transfer

**Mitigation**: Frontend implements pagination (LIMIT/OFFSET)

**Future**: Cursor-based pagination for better performance

---

#### 4. Complex RLS Policies May Be Slow
**Limitation**: Followers-only catches require EXISTS subquery in RLS

**Impact**: May slow down feed queries with many followers

**Mitigation**: Indexes on `profile_follows(follower_id, following_id)`

**Future**: Denormalize follower list if performance degrades

---

### Feature Limitations

#### 5. No Multi-Image Catches
**Limitation**: Each catch has 1 image (image_url)

**Workaround**: Store multiple URLs as JSONB array (requires schema change)

**Future**: Add `catch_images` table with 1:many relationship

---

#### 6. No Video Uploads
**Limitation**: Only external video URLs supported

**Workaround**: Users can link to YouTube/Vimeo

**Future**: Integrate video hosting (Mux, Cloudflare Stream)

---

#### 7. No Catch Editing History
**Limitation**: No audit trail when catch is edited

**Impact**: Cannot see what changed (weight, species, etc.)

**Future**: Add `catch_history` table with snapshots

---

#### 8. No Batch Operations
**Limitation**: No way to delete/edit multiple catches at once

**Future**: Add batch endpoints or frontend multi-select

---

#### 9. No Catch Verification
**Limitation**: No system to verify catch authenticity

**Risk**: Fake catches (Photoshop, old photos, etc.)

**Future**: Implement verification:
- GPS metadata from image
- Timestamp verification
- Community reporting
- Admin verification badge

---

#### 10. No Seasonal Leaderboards
**Limitation**: Leaderboard is all-time only

**Future**: Add filters for:
- This month
- This year
- Seasonal (spring, summer, fall, winter)

---

### Security Limitations

#### 11. No IP-Based Rate Limiting
**Limitation**: Rate limits are per user_id only

**Risk**: User can create multiple accounts to bypass limits

**Mitigation**: Add Cloudflare or API gateway rate limiting (IP-based)

---

#### 12. No CAPTCHA on Signup/Report
**Limitation**: Bots can create accounts or spam reports

**Mitigation**: Rate limiting reduces impact

**Future**: Add CAPTCHA (hCaptcha, reCAPTCHA) on signup and report forms

---

#### 13. No Two-Factor Authentication (2FA)
**Limitation**: Passwords only (no 2FA)

**Risk**: Account compromise via phishing or weak passwords

**Future**: Add 2FA (Supabase supports TOTP, SMS)

---

#### 14. No Content Security Policy (CSP) Headers
**Limitation**: No CSP headers configured

**Risk**: XSS attacks if user-generated content not sanitized

**Mitigation**: Frontend must sanitize all user input (bio, catch descriptions)

---

### Data Limitations

#### 15. No Catch Import/Export
**Limitation**: Users cannot import catches from CSV or export data

**GDPR Risk**: Users have right to data portability

**Future**: Add export function (JSON, CSV)

---

#### 16. No Backup/Restore UI
**Limitation**: Database backups via Supabase dashboard only

**Future**: Automated backups, point-in-time recovery

---

#### 17. No Data Validation on JSONB Fields
**Limitation**: `catches.conditions` JSONB has no schema validation

**Risk**: Frontend may receive unexpected data structure

**Mitigation**: Frontend must handle missing/extra fields gracefully

**Future**: Add JSON Schema validation or use typed JSONB

---

## Future Enhancement Opportunities

### High-Priority Enhancements

#### 1. Full-Text Search
**Impact**: High - improves user experience

**Implementation**:
- Add tsvector column to catches/profiles
- Create GIN index
- Update search queries to use `@@` operator

**Estimated Effort**: 1-2 days

---

#### 2. Real-Time Notifications
**Impact**: High - increases engagement

**Implementation**:
- Supabase Realtime subscriptions on `notifications` table
- Frontend listens for new notifications
- Optional: Push notifications via Firebase

**Estimated Effort**: 2-3 days

---

#### 3. Email Notifications
**Impact**: Medium - re-engagement

**Implementation**:
- Integrate with SendGrid/Postmark
- Daily digest emails (new followers, comments)
- User preferences for notification types

**Estimated Effort**: 3-4 days

---

#### 4. Image Optimization
**Impact**: High - reduces bandwidth, improves load times

**Implementation**:
- Cloudflare Images or imgix integration
- Auto-generate thumbnails (small, medium, large)
- WebP conversion

**Estimated Effort**: 2-3 days

---

#### 5. Catch Verification System
**Impact**: Medium - increases trust

**Implementation**:
- Admin "verified" badge for catches
- EXIF metadata extraction (GPS, timestamp)
- Community voting (upvote/downvote authenticity)

**Estimated Effort**: 5-7 days

---

### Medium-Priority Enhancements

#### 6. Advanced Leaderboards
**Features**:
- Species-specific leaderboards
- Regional leaderboards (by country/state)
- Seasonal leaderboards
- Weekly/monthly leaderboards

**Estimated Effort**: 3-4 days

---

#### 7. Badges & Achievements
**Examples**:
- "First Catch" badge
- "10lb+ Club" badge
- "Species Hunter" (catch 10 different species)
- "Prolific Angler" (100 catches)

**Implementation**: Add `badges` and `user_badges` tables

**Estimated Effort**: 4-5 days

---

#### 8. Catch Sharing
**Features**:
- Generate shareable links (with Open Graph metadata)
- Social media sharing (Twitter, Facebook)
- Embed catch cards on external websites

**Estimated Effort**: 2-3 days

---

#### 9. Weather API Integration
**Implementation**:
- Fetch weather data from API (OpenWeatherMap, WeatherAPI)
- Auto-populate `conditions` JSONB when catch is created
- Show weather icon on catch cards

**Estimated Effort**: 2-3 days

---

#### 10. Venue Submission System
**Flow**:
- Users submit new venue (name, location, coordinates)
- Admins review and approve
- Approved venues added to `venues` table

**Implementation**: Add `venue_submissions` table

**Estimated Effort**: 3-4 days

---

### Low-Priority Enhancements

#### 11. Direct Messaging (DMs)
**Implementation**: Add `messages` and `conversations` tables

**Estimated Effort**: 7-10 days

---

#### 12. Catch Contests
**Features**:
- Admin creates contest (date range, species, region)
- Users enter catches
- Leaderboard for contest entries
- Winner announced

**Implementation**: Add `contests` and `contest_entries` tables

**Estimated Effort**: 7-10 days

---

#### 13. Multi-Language Support
**Implementation**:
- Store translations in database or JSON files
- UI language switcher
- Translate species names, UI strings

**Estimated Effort**: 10-14 days

---

#### 14. Mobile App
**Platforms**: iOS and Android (React Native or Flutter)

**Estimated Effort**: 60-90 days

---

#### 15. Advanced Analytics
**Features**:
- Heatmaps (best fishing times/locations)
- Trend analysis (catch rates over time)
- Predictive insights (best time to fish based on weather)

**Implementation**: Data science pipeline (ETL, ML models)

**Estimated Effort**: 30+ days

---

## Dependencies on External Systems

### Critical Dependencies

#### 1. Supabase Platform
**Dependency**: Database, Auth, Storage, Realtime

**Risk**: Supabase outage = app outage

**Mitigation**:
- Monitor Supabase status page
- Consider multi-region deployment (Supabase Enterprise)
- Backup strategy (regular database exports)

---

#### 2. Supabase Auth
**Dependency**: User authentication and authorization

**Risk**: Auth service outage prevents login

**Mitigation**:
- Cache user sessions locally (JWT tokens)
- Graceful degradation (read-only mode if auth down)

---

#### 3. Supabase Storage
**Dependency**: Image and media hosting

**Risk**: Storage outage prevents image display

**Mitigation**:
- CDN caching (images cached at edge)
- Fallback to placeholder images

---

### Optional Dependencies

#### 4. Email Service (Future)
**Dependency**: SendGrid, Postmark, or AWS SES

**Use Case**: Email notifications, password reset

**Risk**: Email delivery failures

**Mitigation**: Retry queue, fallback to in-app notifications

---

#### 5. Weather API (Future)
**Dependency**: OpenWeatherMap, WeatherAPI

**Use Case**: Auto-populate weather conditions

**Risk**: API rate limits, outages

**Mitigation**: Cache weather data, manual entry fallback

---

#### 6. Geocoding API (Future)
**Dependency**: Google Maps, Mapbox

**Use Case**: Convert addresses to coordinates

**Risk**: API costs, rate limits

**Mitigation**: Cache geocoded results, manual entry fallback

---

#### 7. Image Optimization Service (Future)
**Dependency**: Cloudflare Images, imgix

**Use Case**: Thumbnails, WebP conversion

**Risk**: Additional cost per image

**Mitigation**: Only optimize public images, not private

---

## Data Migration Assumptions

### Migrating from V1 to V2

#### Assumption 1: V1 Database is Read-Only During Migration
**Process**:
1. Put app in maintenance mode
2. Export V1 data
3. Run V2 schema migration
4. Import data into V2 schema
5. Verify data integrity
6. Deploy frontend updates
7. Remove maintenance mode

**Downtime**: Estimated 30-60 minutes

---

#### Assumption 2: Breaking Changes are Acceptable
**Breaking Changes**:
- `profiles.id` → `profiles.user_id`
- `catches.species` (TEXT) → `species_id` (UUID) + `custom_species` (TEXT)
- `catches.location` (TEXT) → `location_label` (TEXT) + `normalized_location` (TEXT)

**Mitigation**: Update all frontend queries before deployment

---

#### Assumption 3: Data Loss is Acceptable for Test Environments
**Warning**: V2 migration uses `DROP TABLE CASCADE`

**Safe for**: Development, staging, test databases

**NOT safe for**: Production (without backup)

---

#### Assumption 4: No Live Traffic During Migration
**Process**: Maintenance mode prevents new data during migration

**Risk**: If migration fails, rollback to V1 database (see ROLLBACK_PLAN.md)

---

### Data Integrity Checks

Post-migration checks:
1. **User count matches**: `SELECT COUNT(*) FROM profiles` (V1 vs V2)
2. **Catch count matches**: `SELECT COUNT(*) FROM catches`
3. **No orphaned records**: All catches have valid `user_id`
4. **Species mapped correctly**: All catches have `species_id` OR `custom_species`
5. **Visibility set**: All catches have non-null `visibility`

---

## Performance Assumptions

### Current Scale Assumptions

#### 1. Early-Stage Product
**Assumption**: < 10,000 users, < 100,000 catches in first year

**Rationale**: Schema optimized for early growth, not massive scale

**When to Re-evaluate**: At 1M catches or 100k users

---

#### 2. Acceptable Query Times
**Assumption**: Queries should complete in < 500ms (p95)

**Current**: Most queries < 100ms with indexes

**Monitoring**: Track slow queries in Supabase dashboard

---

#### 3. Leaderboard Refresh Frequency
**Assumption**: Daily refresh is sufficient

**Rationale**: Leaderboard positions don't change dramatically day-to-day

**Alternative**: Refresh on-demand when user requests leaderboard page (using regular view)

---

#### 4. Rate Limit Cleanup Frequency
**Assumption**: Cleanup every 2-4 hours is sufficient

**Rationale**: Rate limits older than 2 hours are no longer relevant

**Impact**: Minimal database bloat (rate_limits table stays small)

---

### Scalability Thresholds

| Metric | Current | Threshold | Action |
|--------|---------|-----------|--------|
| Total catches | < 1k | 1M | Add partitioning |
| Active users | < 100 | 100k | Optimize RLS policies |
| Leaderboard size | < 100 | 10k | Add pagination |
| Search queries/sec | < 10 | 1000 | Add Algolia |
| Image uploads/day | < 100 | 10k | Add CDN, optimization |

---

## Security Assumptions

### 1. Users Trust Supabase
**Assumption**: Supabase's security (Auth, RLS, Storage) is trustworthy

**Verification**: Supabase is SOC 2 Type II certified, GDPR compliant

---

### 2. Admins are Trusted
**Assumption**: Admin users will not abuse SECURITY DEFINER functions

**Mitigation**: Audit moderation_log regularly, limit admin count

---

### 3. HTTPS Everywhere
**Assumption**: All connections use TLS (enforced by Supabase)

**Risk**: If HTTPS disabled, passwords and tokens exposed

---

### 4. No SQL Injection
**Assumption**: Supabase client library uses parameterized queries

**Verification**: Test with malicious input (e.g., `'; DROP TABLE catches; --`)

---

### 5. Frontend Sanitizes User Input
**Assumption**: Frontend sanitizes HTML in user-generated content (bio, descriptions)

**Risk**: XSS attacks if unsanitized

**Mitigation**: Use DOMPurify or similar library

---

### 6. Service Role Key is Secure
**Assumption**: Service role key stored in environment variables, never committed to Git

**Verification**: Check .env is in .gitignore

---

## Conclusion

These assumptions and trade-offs reflect decisions made for an early-stage fishing app prioritizing:

1. **Simplicity**: Easy to understand and maintain
2. **Security**: Defense-in-depth with RLS and rate limiting
3. **Performance**: Optimized for < 100k catches
4. **Flexibility**: JSONB fields and soft deletes for future needs

**When to Revisit**: At major milestones (10k users, 1M catches, Series A funding)

**Documentation Principle**: Keep this document updated as assumptions change or new trade-offs are made.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Schema Version**: V2 Complete
