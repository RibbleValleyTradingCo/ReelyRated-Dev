**Schema Snapshot (v4 reference, high level)**  
Updated: 2025-12-17 (UI-only)

## Source of truth
- Derived from local schema dumps:
  - `docs/version4/schema/schema.public.local.sql`
  - `docs/version4/schema/schema.full.local.sql`
- Migrations are historical context only.

Main tables (public)
- `profiles` (privacy: `is_private`, avatar fields, warn_count, moderation_status).
- `profile_follows` (follower/following relationships; RLS enabled).
- `profile_blocks` (block relationships; RLS enabled).
- `catches` (catch data, visibility, allow_ratings).
- `catch_comments`, `catch_reactions`, `ratings` (interaction tables; RLS).
- `rate_limits` (per-action logging).
- `reports` (user reports; trigger logs to rate_limits).
- `notifications` (recipient-only).
- `user_warnings` (admin-issued warnings).
- `moderation_log` (admin actions).
- `venues`, `venue_events`, venue-related views/rpcs (owners/admin).

Key enums (examples)
- `visibility_type` (public/followers/private).
- `report_target_type` (catch/comment/profile).
- `notification_type`, `warning_severity`, etc.

Triggers / functions (from migrations)
- `enforce_report_rate_limit` trigger on `reports` (single logger to rate_limits).
- `check_rate_limit` helper; `enforce_*_rate_limit` for catches/comments.
- Various admin RPCs (`admin_list_reports`, `admin_list_moderation_log`, etc.).
- Follow/block RPCs (`follow_profile_with_rate_limit`, `block_profile`, `unblock_profile`).
- Rating/interaction RPCs (`get_catch_rating_summary`, `rate_catch_with_rate_limit`, `react_to_catch_with_rate_limit`).

RLS highlights
- `profiles`, `profile_follows`, `profile_blocks`, `catches`, `catch_comments`, `catch_reactions`, `ratings`, `notifications`, `reports`, `user_warnings`, `moderation_log`, `rate_limits`, `venues` all have RLS enabled (per migrations).
- Admin access typically via membership in `admin_users` table checked in functions/policies.

TODO
- Add detailed columns/indexes per table if needed for UI reference.
- List storage buckets/objects if v4 UI surfaces them.
