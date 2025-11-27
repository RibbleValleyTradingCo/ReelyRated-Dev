Admin UI Roadmap (Reports, Audit Log, Moderation)

Overview

This document describes how we want the admin experience to evolve over time.
The goal is to make moderation:
• Fast to work through (queue-like, not just long lists)
• Easy to understand at a glance
• Safe and predictable for admins

Note for Codex:
Before implementing anything in this document, always review:
• docs/erd.md (or docs/erd2.md)
• docs/frontend-map-of-pages.md
to ensure changes align with the planned data model and page architecture.

We’ll implement this in small, reviewable phases.

⸻

Goals 1. Reports page becomes a clear triage queue for incoming reports. 2. Audit log feels like a real log viewer with powerful filtering and time scoping. 3. User moderation page is a single, reliable place to understand a user’s history. 4. Navigation between Reports ↔ Audit log ↔ User moderation is seamless. 5. UI can scale to hundreds/thousands of rows without becoming unusable.

⸻

Phase 1 – Reports page as a triage queue

Current
• Route: /admin/reports
• Filters: by target type (All / Catch / Comment / Profile)
• List: vertical stack of cards with type + status + “View target” + “Moderation actions” (drawer)
• Drawer: shows target, prior warnings, moderation history, actions (warn, delete/restore, resolve/dismiss)

Desired outcomes
• Admins focus on open and recent reports by default.
• The list is dense enough to scan quickly, but still readable.
• The drawer is the primary “work surface” for resolving reports.
• Pagination/sorting prevents the list from becoming an endless scroll.

Tasks

1. Status filters
   • Add a status filter bar below the existing type filters:
   • All · Open · In review (optional) · Resolved · Dismissed
   • Default to Open when first landing on the page.
   • Combine with existing type filter (type + status).

2. Card density & layout
   • Keep card style consistent with existing design, but:
   • Compress header into one line:
   • [TYPE pill] [STATUS pill] · [relative time] · (optional) [# reports]
   • Move “Reported by @user” into a smaller, muted line.
   • Ensure at least 5–8 cards are visible on a typical laptop screen.

3. Sorting & pagination
   • Add a sort control (dropdown or segmented control):
   • Newest first (default)
   • Oldest first
   • Most reported (if we have/introduce an aggregated count)
   • Add pagination or “Load more”:
   • Show e.g. 20 reports per page.
   • Indicate total count: Showing 20 of 482 reports.

4. Drawer refinements
   • In the drawer header, show a compact target summary:
   • Avatar + username (or catch title) + quick link to profile/catch.
   • Current moderation status for the user (Warned / Suspended / etc.).
   • Group actions into clear sections:
   • Content actions: Delete / Restore / View target.
   • User actions: Warn user / Suspend user / View moderation history.
   • After an action (resolve / dismiss / warn / delete), ensure:
   • The report card in the background shows updated status.
   • Optionally show a small “Updated” chip or short inline success message.

5. Empty/loading states
   • Add friendly, explicit states:
   • Loading: “Loading reports…”
   • No results (after filters): “No reports match these filters.”

⸻

Phase 2 – Audit log as a proper log viewer

Current
• Route: /admin/audit-log
• Filters: action dropdown + free-text search + sort newest/oldest
• Table: timestamp, relative time, admin, action, target, reason
• Features: CSV export, “Moderation” button when row relates to a user

Desired outcomes
• Admins can scope the log by time range and action type.
• High-signal events (warns, suspensions, deletes) are easy to spot.
• The log scales gracefully via pagination.

Tasks

1. Date range filter
   • Add a “Date range” control near the action filter/search:
   • Last 24 hours
   • Last 7 days (default)
   • Last 30 days
   • All time
   • Apply this on the backend query so we don’t fetch unbounded rows.

2. Action and target clarity
   • Display actions as small badges:
   • Warned user
   • Deleted comment
   • Restored catch
   • Suspended user, etc.
   • For the “Target” column:
   • Prefer human-friendly labels: user: @username, catch: <title>, comment on @owner.
   • Show raw IDs only as a muted secondary line or tooltip.

3. Pagination & counts
   • Paginate the log (e.g. 100 rows per page).
   • Show a short summary: Showing 100 of 1,234 actions (Last 7 days, All actions).
   • Keep CSV export scoped to the current filter + date range.

4. Filter feedback
   • When filters or search are active, show a small “Filters applied” pill with:
   • A summary (Last 7 days · Warnings · "test")
   • “Clear all” action.

⸻

Phase 3 – User moderation overview

Current
• Route: /admin/users/:userId/moderation
• Access: guarded by useAdminAuth
• Data:
• Profile: moderation_status, warn_count, suspension_until
• Warnings list: user_warnings with reasons/severity/admin/duration
• Moderation history: entries from moderation_log
• Navigation:
• From Reports drawer (“View moderation history”)
• From Audit log (“Moderation” button)
• From profile (admin-only “Moderation” link)

Desired outcomes
• Page feels like a single source of truth for a user’s moderation state.
• Admins can understand in seconds:
• “Who is this user?”
• “Are they currently limited?”
• “What has been done before?”

Tasks

1. Top summary card
   Add a summary card at the top with:
   • Avatar + username + user id (small).
   • Current status:
   • Active
   • Warned
   • Suspended until <date>
   • Banned (if/when implemented).
   • Warning count: e.g. Warnings: 1 / 3.
   • Quick actions/links:
   • “View profile”
   • (Later) “View all reports about this user”.

2. Sections & empty states
   • Warnings section:
   • Table: issued date, severity, reason, duration, admin.
   • Empty state: “No warnings issued yet.”
   • Moderation history section:
   • Table: timestamp, action, target, reason, admin.
   • Paginate or “Load more” when there are many rows.
   • Empty state: “No moderation actions recorded yet.”

3. Navigation polish
   • Keep the new header: “ADMIN · Moderation for @username”.
   • Back button behaviour:
   • If navigated from Reports, go back to Reports (with prior filters intact if possible).
   • If from Audit log, go back there.
   • Otherwise, go to user profile.

⸻

Phase 4 – Cross-page & UX polish

These can be sprinkled in once the core flows are stable.

Tasks 1. Consistent “Admin” context
• Make sure all admin pages show a consistent “ADMIN” label + heading pattern.
• Use similar subheading text (e.g. “Review and act on user reports.”). 2. Keyboard shortcuts (nice-to-have)
• On Reports:
• Up/Down to move between reports.
• Enter to open “Moderation actions”.
• R to mark resolved, D to dismiss (with confirmation).
• Only active when focus is inside the admin content, not global. 3. Performance considerations
• Ensure all large lists are server-paginated.
• Avoid fetching “all time” by default in Audit log. 4. Future: Admin home / dashboard (Phase 2+)
• /admin landing:
• “Open reports” count and link.
• “Recent warnings/suspensions”.
• Quick links to:
• Reports
• Audit log
• User search (when implemented)

⸻

Implementation notes for Codex
• Work should be done page-by-page and phase-by-phase.
• For each phase or chunk: 1. Plan: restate the intended change (using this doc as source). 2. Implement: keep changes as small and localized as possible. 3. Report: summarise which files changed and how behaviour was affected.
• Avoid refactoring unrelated code while working on these tasks.
• Always ensure:
• Admin gating (useAdminAuth / isAdminUser) is preserved.
• No changes to RLS, RPCs, or database schema unless explicitly requested.
