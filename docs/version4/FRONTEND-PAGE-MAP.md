**Frontend Page Map (v4 UI)**  
Updated: 2025-12-19

### Public marketing/browse

- `/` → `src/pages/Index.tsx` (Landing; hero, feature cards, social proof; v4 primitives + typography applied).
- `/venues` → `src/pages/VenuesIndex.tsx` (Venues directory; filters/search; v4 primitives + typography applied).
- `/venues/:slug` → `src/pages/VenueDetail.tsx` (Venue detail; hero, actions, photos, stats, events, community catches; v4 primitives + typography applied).
- `/leaderboard` → `src/pages/LeaderboardPage.tsx` (Leaderboard table/cards; v4 primitives + typography applied).
- `*` → `src/pages/NotFound.tsx` (Single centered card; “your page got away…” copy + Home/Venues CTAs; v4 primitives + typography applied).
- Baselines required: landing, venues index/detail (see `visual-baseline/README.md` for viewports/naming).

### Auth core social

- `/feed` → `src/pages/Feed.tsx` (Feed cards, filters; v4 primitives + typography applied).
- `/add-catch` → `src/pages/AddCatch.tsx` (Catch form; v4 primitives + typography applied).
- `/catch/:id` → `src/pages/CatchDetail.tsx` (Catch detail, comments, ratings; v4 primitives + typography applied; layout alignment pass applied).
- `/profile/:slug` → `src/pages/Profile.tsx` (Profile header, stats, catches; v4 primitives + typography applied).
- `/settings/profile` → `src/pages/ProfileSettings.tsx` (Profile settings; v4 primitives + typography applied).
- `/sessions` → `src/pages/Sessions.tsx` (Sessions; v4 primitives + typography applied).
- `/search` → `src/pages/Search.tsx` (Search; v4 primitives + typography applied).
- `/insights` → `src/pages/Insights.tsx` (Insights; v4 primitives + typography applied; spacing/hierarchy pass applied).
- `/my/venues` → `src/pages/MyVenues.tsx` (Owner venues list; v4 primitives applied; mobile overflow-safe).
- `/my/venues/:slug` → `src/pages/MyVenueEdit.tsx` (Owner venue edit; v4 primitives applied; mobile overflow-safe).
- Baselines required: feed, catch detail, profile; sessions optional; see `visual-baseline/README.md`.

### Admin

- `/admin/reports` → `src/pages/AdminReports.tsx` (Moderation queue; v4 primitives + typography applied; mobile-first overflow/wrapping fixes applied).
- `/admin/audit-log` → `src/pages/AdminAuditLog.tsx` (Audit log; v4 primitives + typography applied; mobile-safe filters/table overflow).
- `/admin/users/:userId/moderation` → `src/pages/AdminUserModeration.tsx` (User moderation; v4 primitives + typography applied; mobile-safe actions/tables).
- `/admin/venues` → `src/pages/AdminVenuesList.tsx` (Admin venues list; v4 primitives + typography applied; mobile overflow-safe).
- `/admin/venues/:slug` → `src/pages/AdminVenueEdit.tsx` (Admin venue edit; v4 primitives + typography applied; mobile overflow-safe).
- Baselines recommended: admin reports/moderation; see `visual-baseline/README.md`.

### Auth/account

- `/auth` → `src/pages/Auth.tsx` (no navbar).
- `/account-deleted` → `src/pages/AccountDeleted.tsx` (no navbar; single centered card + CTAs; v4 primitives + typography applied).

### Notes

- Shared shell: `src/components/Layout.tsx` renders Navbar + Suspense (`RouteSkeleton`) + DeletedAccountGate around outlet.
- Guards: `RequireAuth` wraps authed/admin routes; admin checks occur inside admin pages.
- Section structure: pages are being migrated to v4 primitives (PageContainer/Section/SectionHeader + Heading/Text/Eyebrow) which wrap the existing `.section-container` and shadcn/ui primitives (Card, Button, etc.).
- Import rule: prefer direct file imports for v4 primitives/typography (avoid casing conflicts with `src/components/Layout.tsx`).
- Suspense: Only inside `Layout`, fallback = `RouteSkeleton` (content-only), so navbar stays mounted across route changes.
- Layout scope: All routes except `/auth` and `/account-deleted` are children of `Layout`. Guards (RequireAuth) wrap elements inside those routes; admin enforcement is inside page components.
