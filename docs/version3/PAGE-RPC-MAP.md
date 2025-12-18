Page → RPC → Tables/Views Map

This document maps each route/page in ReelyRated v3 to the Supabase RPCs (and direct table/view calls) it uses, and the underlying tables/views those RPCs touch.

The goal is to:
• Drive our harden/test phase page-by-page.
• Make it easy to see what data each page depends on.
• Help spot risk areas (sensitive tables, admin functions, complex joins).

❗ This file is intentionally a mix of concrete entries and TBD placeholders.
Codex should expand the TBD areas by scanning the codebase, especially src/pages/**, src/lib/**, and src/integrations/\*\*.

⸻

Conventions
• Route: SPA route as defined in the router (e.g. /venues/:slug).
• Page Component: Main React entry point under src/pages.
• RPC / Call:
• Supabase RPCs (e.g. create_comment_with_rate_limit, get_venue_recent_catches).
• Direct .from('<table>') or .rpc('<function>') calls.
• Resource Type:
• rpc – Supabase Postgres function exposed via RPC.
• table / view – direct select/insert/update/delete.
• Tables/Views Touched: The primary DB objects; some RPCs hit multiple tables via joins.

Format per page: a table

Feature / Area | RPC / Call | Resource Type | Tables / Views Touched | Notes

1. Auth, Shell & Global Services

1.1 Auth Pages (Sign in / Sign up / Password reset)

• Routes: /auth, /auth/reset, /auth/forgot-password (as applicable)
• Page Components: src/pages/Auth.tsx
• Supporting libs/hooks: src/integrations/supabase/client.ts, src/components/AuthProvider.tsx, src/lib/env-validation.ts
• Feature / Area: Auth: email/password sign-in
• RPC / Call: Supabase auth signInWithPassword
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: Scan Auth.tsx for Supabase auth client usage.

• Feature / Area: Auth: sign-up
• RPC / Call: Supabase auth signUp
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: Include metadata fields (username, etc).

• Feature / Area: Auth: forgot/reset password (request link)
• RPC / Call: Supabase auth resetPasswordForEmail
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: Uses resetPasswordForEmail flow.

• Feature / Area: Auth: password reset (update password)
• RPC / Call: Supabase auth updateUser (password)
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: Uses updateUser flow.

1.2 App Shell & Navigation

• Routes: all routes (layout wrapper)
• Components: App shell/layout components, nav/sidebar, top-level router
• Supporting libs/hooks: src/components/ui/sidebar.tsx, src/components/ui/navigation-menu.tsx, src/components/AuthProvider.tsx

• Feature / Area: App bootstrap: current user
• RPC / Call: Supabase auth getUser/getSession
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: How we fetch current profile/session on load.

• Feature / Area: Nav badges (notifications, etc.)
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Any count badges in the shell.

• Feature / Area: Global feature flags / env checks
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Mostly env-validation.ts, no DB.

1.3 Global Background Services (Notifications, Presence)

• Scope: Providers/hooks that live at app root and run across pages.
• Components: src/components/AuthProvider.tsx, notification listeners, toasts.
• Supporting libs/hooks: src/lib/notifications.ts, any realtime subscriptions.

• Feature / Area: Notification polling / fetch
• RPC / Call: create_notification (on new events), notifications table select (helpers)
• Resource Type: rpc/table
• Tables / Views Touched: notifications
• Notes: Check src/lib/notifications.ts.

• Feature / Area: Mark notification as read
• RPC / Call: notifications table update
• Resource Type: table
• Tables / Views Touched: notifications
• Notes: Identify mutating calls.

• Feature / Area: Realtime subscriptions
• RPC / Call: Supabase realtime (channels)
• Resource Type: rpc
• Tables / Views Touched: notifications (realtime)
• Notes: Any supabase.channel subscriptions.

2. Core Social: Feed, Profiles, Catches, Comments

2.1 Feed / Home

• Routes: /, /feed, /community
• Page Components: src/pages/Feed.tsx
• Supporting libs/hooks: catch/comment hooks under src/lib/\*\*, domain mappers in src/types/domain.ts

• Feature / Area: Feed: main catch list
• RPC / Call: catches table select (with profiles, venues, ratings, catch_comments, catch_reactions joins)
• Resource Type: table
• Tables / Views Touched: catches, profiles, venues, ratings, catch_comments, catch_reactions
• Notes: Look for paginated list RPC.

• Feature / Area: Feed: “people you follow” filter
• RPC / Call: profile_follows table select
• Resource Type: table
• Tables / Views Touched: follows, catches
• Notes: Used by the top filter.

• Feature / Area: Feed: reactions / likes
• RPC / Call: catch_reactions table insert/delete
• Resource Type: table
• Tables / Views Touched: catch_reactions
• Notes: Includes add/remove reaction.

• Feature / Area: Feed: comment counts / previews
• RPC / Call: catches select with catch_comments join
• Resource Type: table
• Tables / Views Touched: catch_comments
• Notes: Any aggregate RPC.

2.2 Catch Detail / Add Catch

• Routes: /catches/:id, /add-catch
• Page Components: src/pages/AddCatch.tsx and any catch detail page
• Supporting libs/hooks: catch services in src/lib/\*\*, domain mappers in src/types/domain.ts

• Feature / Area: Create catch
• RPC / Call: catches table insert
• Resource Type: table
• Tables / Views Touched: catches
• Notes: Includes length_unit, weight_unit, conditions JSON.

• Feature / Area: Update catch
• RPC / Call: catches table update
• Resource Type: table
• Tables / Views Touched: catches
• Notes: Edit existing catch.

• Feature / Area: Delete catch
• RPC / Call: catches table delete/soft-delete
• Resource Type: table/rpc
• Tables / Views Touched: catches
• Notes: Could be soft-delete.

• Feature / Area: Attach media (photos/video)
• RPC / Call: storage uploads (catches bucket)
• Resource Type: storage/rpc
• Tables / Views Touched: storage buckets + catches
• Notes: Check any storage client usage.

2.3 Comments & Mentions

• Routes: catch detail pages where comments are shown
• Page Components: any component using comment hooks (e.g. useCatchComments)
• Supporting libs/hooks: comment RPC helpers in src/lib/\*\*

• Feature / Area: Create comment (with rate limit)
• RPC / Call: create_comment_with_rate_limit
• Resource Type: rpc
• Tables / Views Touched: catch_comments, notifications, rate-limit tables
• Notes: Threading via parent_comment_id, mentions.

• Feature / Area: List comments for catch
• RPC / Call: catch_comments_with_admin view select
• Resource Type: view
• Tables / Views Touched: catch_comments, profiles
• Notes: Check for threaded view.

• Feature / Area: Delete / restore comment
• RPC / Call: catch_comments table update
• Resource Type: table
• Tables / Views Touched: catch_comments
• Notes: Moderation and owner delete.

2.4 Profiles & Following

• Routes: /profile/:username, /me, /settings/profile
• Page Components: src/pages/ProfileSettings.tsx and profile view page
• Supporting libs/hooks: profile helpers, follow helpers, domain mappers

• Feature / Area: View profile
• RPC / Call: profiles table select (plus catches/follows queries on profile pages)
• Resource Type: table
• Tables / Views Touched: profiles, catches, profile_follows
• Notes: Includes stats like total catches.

• Feature / Area: Follow / unfollow
• RPC / Call: profile_follows table insert/delete
• Resource Type: table
• Tables / Views Touched: follows
• Notes: Triggers notifications.

• Feature / Area: Blocked profiles
• RPC / Call: profile_blocks table insert/delete
• Resource Type: table
• Tables / Views Touched: profile_blocks, profiles
• Notes: See mapping fixed in ProfileSettings.tsx.

3. Venues

3.1 Venues Index / Directory

• Routes: /venues
• Page Components: src/pages/VenuesIndex.tsx
• Supporting libs/hooks: venue domain mappers in src/types/domain.ts, thumbnail/image helpers

• Feature / Area: List venues (paginated)
• RPC / Call: get_venues
• Resource Type: rpc
• Tables / Views Touched: venues, venue_stats
• Notes: Includes sort/filter.

• Feature / Area: Search / filters
• RPC / Call: get_venues
• Resource Type: rpc
• Tables / Views Touched: venues, venue_stats
• Notes: By ticket type, tags, region etc.

• Feature / Area: Venue thumbnails
• RPC / Call: get_venue_photos, get_venue_recent_catches
• Resource Type: rpc
• Tables / Views Touched: venue_photos, catches
• Notes: Check how thumbnails state is populated.

3.2 Venue Detail

• Routes: /venues/:slug
• Page Components: src/pages/VenueDetail.tsx
• Supporting libs/hooks: venue mappers, catch mappers, RPC helpers

• Feature / Area: Load venue by slug
• RPC / Call: get_venue_by_slug
• Resource Type: rpc
• Tables / Views Touched: venues, venue_stats
• Notes: Uses slug → id mapping.

• Feature / Area: Recent catches at venue
• RPC / Call: get_venue_recent_catches
• Resource Type: rpc
• Tables / Views Touched: catches, profiles, species, possibly venues
• Notes: We recently fixed weight_unit typing.

• Feature / Area: Venue ratings / stats
• RPC / Call: get_venue_by_slug
• Resource Type: rpc
• Tables / Views Touched: venue_ratings, venue_stats
• Notes: If present on the page.

• Feature / Area: Venue events preview
• RPC / Call: get_venue_upcoming_events, get_venue_past_events
• Resource Type: rpc
• Tables / Views Touched: venue_events
• Notes: Small subset of upcoming events.

3.3 My Venues & Venue Editing

• Routes: /my-venues, /my-venues/:venueId/edit
• Page Components: src/pages/MyVenues.tsx, src/pages/MyVenueEdit.tsx, src/pages/AdminVenueEdit.tsx
• Supporting libs/hooks: venue admin RPCs, domain mappers, VenueEvent typing

• Feature / Area: List venues I own/manage
• RPC / Call: venues table select via venue_owners join
• Resource Type: table
• Tables / Views Touched: venue_owners, venues
• Notes: See OwnerVenueRow typing.

• Feature / Area: Update venue details
• RPC / Call: owner_update_venue_metadata, admin_update_venue_metadata
• Resource Type: rpc
• Tables / Views Touched: venues
• Notes: Includes facilities, best_for_tags, contact_phone, etc.

• Feature / Area: Venue events CRUD
• RPC / Call: owner_get_venue_events, owner_create_venue_event, owner_update_venue_event, owner_delete_venue_event, admin_get_venue_events, admin_create_venue_event, admin_update_venue_event, admin_delete_venue_event
• Resource Type: rpc
• Tables / Views Touched: venue_events
• Notes: See VenueEvent mapping (contact_phone etc).

• Feature / Area: Admin venue moderation
• RPC / Call: admin_add_venue_owner, admin_remove_venue_owner
• Resource Type: rpc
• Tables / Views Touched: venue_owners, venues, profiles
• Notes: AdminVenueEdit.tsx RPCs.

4. Admin / Moderation

4.1 User Moderation

• Routes: /admin/users/:id, /admin/moderation
• Page Components: src/pages/AdminUserModeration.tsx
• Supporting libs/hooks: src/lib/notifications.ts, admin RPC helpers

• Feature / Area: List warnings for user
• RPC / Call: user_warnings table select
• Resource Type: table
• Tables / Views Touched: user_warnings, profiles
• Notes: See WarningRow mapping.

• Feature / Area: List moderation log
• RPC / Call: admin_list_moderation_log (TBC)
• Resource Type: rpc
• Tables / Views Touched: moderation_log, profiles, catches, catch_comments
• Notes: Confirm actual RPC name.

• Feature / Area: Warn user
• RPC / Call: admin_warn_user
• Resource Type: rpc
• Tables / Views Touched: user_warnings, notifications
• Notes: Payload we just typed.

• Feature / Area: Clear moderation status
• RPC / Call: admin_clear_moderation_status
• Resource Type: rpc
• Tables / Views Touched: profiles, user_warnings
• Notes: Check side effects.

4.2 Admin Venue Tools

• Routes: /admin/venues, /admin/venues/:id
• Page Components: src/pages/AdminVenueEdit.tsx
• Supporting libs/hooks: venue admin RPCs, OwnerRow typing

• Feature / Area: List venues for admin
• RPC / Call: get_venues
• Resource Type: rpc
• Tables / Views Touched: venues, venue_stats
• Notes: Admin-scoped fetch.

• Feature / Area: Update venue ownership
• RPC / Call: admin_add_venue_owner, admin_remove_venue_owner
• Resource Type: rpc
• Tables / Views Touched: venue_owners, profiles
• Notes: Uses OwnerRow.

• Feature / Area: Admin venue status (publish/unpublish)
• RPC / Call: admin_update_venue_metadata
• Resource Type: rpc
• Tables / Views Touched: venues
• Notes: Moderation/status fields.

5. Insights / Analytics

5.1 User Insights Dashboard

• Routes: /insights
• Page Components: src/pages/Insights.tsx
• Supporting libs/hooks: src/components/insights/ChartCard.tsx, stats RPCs

• Feature / Area: Catch volume over time
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Time-series data.

• Feature / Area: Best venues/species charts
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Aggregated stats for charts.

• Feature / Area: Engagement metrics (reactions/comments)
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Used in engagement charts.

6. Search & Discovery

6.1 Global Search (Users / Venues / Catches)

• Routes: /search (or search UI embedded in other pages)
• Page Components: any search-specific page or search bar component
• Supporting libs/hooks: search RPCs under src/lib/\*\*

• Feature / Area: Search profiles
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Likely fuzzy search on username/full_name.

• Feature / Area: Search venues
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: By name/location.

• Feature / Area: Search catches
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Filterable by species/venue/time.

7. Settings / Account Management

7.1 Profile & Privacy Settings

• Routes: /settings/profile, /settings/account
• Page Components: src/pages/ProfileSettings.tsx
• Supporting libs/hooks: profile helpers, blocklist helpers, auth helpers

• Feature / Area: Update profile
• RPC / Call: profiles table update
• Resource Type: table
• Tables / Views Touched: profiles
• Notes: Bio, avatar, location, website, etc.

• Feature / Area: Block / unblock user
• RPC / Call: profile_blocks table insert/delete; unblock_profile rpc
• Resource Type: table
• Tables / Views Touched: profile_blocks, profiles
• Notes: Uses BlockedProfileEntry.

• Feature / Area: Privacy controls (private profile, deletion flags)
• RPC / Call: profiles table update
• Resource Type: table
• Tables / Views Touched: profiles
• Notes: Fields like is_private, locked_for_deletion.

7.2 Account / Auth Settings

• Routes: /settings/security (if exists), auth-related flows
• Page Components: parts of src/pages/Auth.tsx and any dedicated security page
• Supporting libs/hooks: Supabase auth client

• Feature / Area: Change email
• RPC / Call: Supabase auth updateUser (email)
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: Uses Supabase auth APIs.

• Feature / Area: Change password
• RPC / Call: Supabase auth updateUser (password)
• Resource Type: rpc
• Tables / Views Touched: Auth schema
• Notes: In-session password update.

• Feature / Area: Delete account
• RPC / Call: request_account_deletion rpc
• Resource Type: rpc
• Tables / Views Touched: profiles (deletion flags), catches, auth schema
• Notes: Check soft-delete semantics.

8. Onboarding & Empty States

8.1 Onboarding Flows

• Routes: first-login flows, optional /onboarding
• Page Components: any onboarding-specific components referenced from Auth or Shell
• Supporting libs/hooks: profile completion helpers

• Feature / Area: First-time profile setup
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Ensure idempotent updates.

• Feature / Area: Intro default data (e.g. tips)
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: If present.

8.2 Empty State Data Fetches

• Routes: various pages when user has no data yet
• Page Components: Feed.tsx, Insights.tsx, venue pages, etc.
• Supporting libs/hooks: chart/loaders, counters

• Feature / Area: Empty feed
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Make sure query returns empty list safely.

• Feature / Area: Empty insights
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Chart RPCs should handle no rows.

9. Error Handling & Edge-Case Flows

9.1 404 / Not Found

• Routes: \* catch-all
• Page Components: Not-found page component in src/pages/\*\*
• Supporting libs/hooks: router config

• Feature / Area: Not found page
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Mostly routing; no DB.

9.2 Unauthorized / Forbidden

• Routes: redirects from protected pages
• Page Components: any guards in AuthProvider or route wrappers
• Supporting libs/hooks: AuthProvider, any useRequireAuth hook

• Feature / Area: Auth guard checks
• RPC / Call: Supabase auth getUser/getSession; profiles table select (admin/mode checks in guards)
• Resource Type: rpc/table
• Tables / Views Touched: Auth schema, profiles
• Notes: Checks user role/admin flags.

• Feature / Area: RLS/forbidden error handling
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Surface Supabase errors in UI.

10. Non-Page Utilities & Tests

10.1 Shared Libs (Notifications, Rate Limits, Tags, Species)

• Files: src/lib/notifications.ts, tag/bait/species helpers, rate limit helpers
• Supporting types: src/types/domain.ts, src/types/database.ts

• Feature / Area: Notification creation helpers
• RPC / Call: create_notification
• Resource Type: rpc
• Tables / Views Touched: notifications
• Notes: Any helpers that wrap RPCs.

• Feature / Area: Rate limit checks
• RPC / Call: check_rate_limit
• Resource Type: rpc
• Tables / Views Touched: rate_limits
• Notes: Used by comments and other actions.

• Feature / Area: Tag/species helpers
• RPC / Call: tags table select; baits table select
• Resource Type: table
• Tables / Views Touched: tags, baits
• Notes: Lookup tables.

10.2 Test Utilities

• Files: src/test/auth-utils.ts and other test helpers
• Purpose: test-only shims/mocks

• Feature / Area: Auth test helpers
• RPC / Call: N/A
• Resource Type: N/A
• Tables / Views Touched: N/A
• Notes: Only mock User objects; no real DB calls.
