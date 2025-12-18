**UI Smoke Runbook (v4, 10–15 min)**  
Updated: 2025-12-17

### Prep
- Use mobile viewport (iPhone) then desktop.
- Ensure dev server running; signed-in users available (A/B/C/D/Admin).

### Steps
1) Landing (`/`): Hero, nav links; Navbar stays mounted; no console errors.
2) Venues index (`/venues`): Cards load; skeletons only in content; navbar persists.
3) Venue detail (`/venues/:slug` with catches): Scroll hero → actions → photos → record → community catches; no overlap/gaps; navbar stays; single column ok on mobile.
4) Feed (`/feed`, authed): Redirect if not authed; otherwise cards/skeletons render; no full-screen spinner.
5) Catch detail (`/catch/:id`, authed): Inaccessible catch → single toast + single redirect to `/feed`; accessible catch renders hero/comments; navbar persists.
6) Add comment/report: Post a comment; open comment report modal (no reload).
7) Profile (`/profile/:slug`): Header/stats load; follow/unfollow button works; skeletons content-only.
8) Notifications bell: Opens panel (if available) without shell remount.
9) Admin reports (`/admin/reports`, admin): Loads queue; no navbar flicker; skeletons content-only.
10) Admin user moderation (`/admin/users/:userId/moderation`, admin): Loads warnings/logs; dialogs open; no full-screen loaders.

### Acceptance checks
- Navbar never disappears; Network shows no “Doc” reloads after first load.
- Protected routes redirect without flashing content.
- Skeleton shimmer appears only in content areas (not covering navbar).
- Inaccessible catch: exactly one toast + one redirect per catch id.
- No visual overlap on venue detail sections (mobile).
