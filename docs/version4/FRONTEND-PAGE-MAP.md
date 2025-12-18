**Frontend Page Map (v4 UI)**  
Updated: 2025-12-17

### Public marketing/browse
- `/` → `src/pages/Index.tsx` (Landing; hero, feature cards, social proof).
- `/venues` → `src/pages/VenuesIndex.tsx` (Venues directory; filters/search).
- `/venues/:slug` → `src/pages/VenueDetail.tsx` (Venue detail; hero, actions, photos, stats, events, community catches).
- `/leaderboard` → `src/pages/LeaderboardPage.tsx` (Leaderboard table/cards).
- `*` → `src/pages/NotFound.tsx`.

### Auth core social
- `/feed` → `src/pages/Feed.tsx` (feed cards, filters).
- `/add-catch` → `src/pages/AddCatch.tsx` (catch form).
- `/catch/:id` → `src/pages/CatchDetail.tsx` (catch detail, comments, ratings).
- `/profile/:slug` → `src/pages/Profile.tsx` (profile header, stats, catches).
- `/settings/profile` → `src/pages/ProfileSettings.tsx`.
- `/sessions` → `src/pages/Sessions.tsx`.
- `/search` → `src/pages/Search.tsx`.
- `/insights` → `src/pages/Insights.tsx`.
- `/my/venues` → `src/pages/MyVenues.tsx`.
- `/my/venues/:slug` → `src/pages/MyVenueEdit.tsx`.

### Admin
- `/admin/reports` → `src/pages/AdminReports.tsx`.
- `/admin/audit-log` → `src/pages/AdminAuditLog.tsx`.
- `/admin/users/:userId/moderation` → `src/pages/AdminUserModeration.tsx`.
- `/admin/venues` → `src/pages/AdminVenuesList.tsx`.
- `/admin/venues/:slug` → `src/pages/AdminVenueEdit.tsx`.

### Auth/account
- `/auth` → `src/pages/Auth.tsx` (no navbar).
- `/account-deleted` → `src/pages/AccountDeleted.tsx` (no navbar).

### Notes
- Shared shell: `src/components/Layout.tsx` renders Navbar + Suspense (`RouteSkeleton`) + DeletedAccountGate around outlet.
- Guards: `RequireAuth` wraps authed/admin routes; admin checks occur inside admin pages.
- Section structure: most pages use `.section-container` (max-w-6xl + padding) and shadcn/ui primitives (Card, Button, etc.).
