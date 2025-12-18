**Loading / Empty / Error Inventory (v4)**  
Updated: 2025-12-17

### Page-level
- **Landing `/` (Index.tsx)**  
  - Loading: stats cards show “—” / “Fetching live stats…” (count-up gated); no spinner.  
  - Empty/Error: N/A (static content).  
  - Skeleton: Hero + feature cards + stats tiles.

- **Venues index `/venues` (VenuesIndex.tsx)**  
  - Loading: Loader2 + “Loading venues…” at page top; load-more button shows spinner.  
  - Empty: “No venues” block.  
  - Error: Console/log only.  
  - Skeleton: VenueCardSkeleton grid, filter bar skeleton, load-more placeholder.

- **Venue detail `/venues/:slug` (VenueDetail.tsx)**  
  - Loading: Centered Loader2.  
  - Empty: Not-found card.  
  - Errors: Toast/log.  
  - Skeleton: Hero + actions row + photos grid + record card + sidebar stats + catches/events list; no overlap.

- **Feed `/feed` (Feed.tsx)**  
  - Loading: `LoadingState` spinner fullscreen-ish; “Loading your feed…”.  
  - Empty: Empty feed text.  
  - Error: Toast/log.  
  - Skeleton: FeedCardSkeleton list + filter bar.

- **Catch detail `/catch/:id` (CatchDetail.tsx)**  
  - Loading: “Loading...” text page placeholder.  
  - Empty: N/A.  
  - Error: Toast/log; inaccessible triggers redirect/toast.  
  - Skeleton: CatchDetailSkeleton (hero + sidebar + comments list).

- **Add catch `/add-catch` (AddCatch.tsx)**  
  - Loading: “Loading...” page placeholder while checking auth/admin; section-level spinners for methods/baits/water types/sessions.  
  - Empty/Error: Toast/log.  
  - Skeleton: Form blocks, select placeholders, gallery upload stub.

- **Profile `/profile/:slug` (Profile.tsx)**  
  - Loading: Loader2 + “Loading profile…”; block status loading gates view; follow/block buttons show “Updating…/Working…”.  
  - Empty: Sections empty as data dictates.  
  - Error: Toast/log; blocked-view stubs.  
  - Skeleton: ProfileHeader + stats grid + list skeleton.

- **Profile settings `/settings/profile` (ProfileSettings.tsx)**  
  - Loading: Loader2 + “Loading profile settings…”; section spinners for blocked list, password, data export/delete.  
  - Empty: Blocked list empty text.  
  - Error: Toast/log.  
  - Skeleton: Form sections, list skeleton for blocked users.

- **Sessions `/sessions` (Sessions.tsx)**  
  - Loading: “Loading sessions…” text.  
  - Empty: Empty list text.  
  - Error: Toast/log.  
  - Skeleton: Table/list skeleton.

- **Search `/search` (Search.tsx)**  
  - Loading: Loader2 in submit button.  
  - Empty: No results text.  
  - Error: Toast/log.  
  - Skeleton: Result list skeleton + filter bar.

- **Insights `/insights` (Insights.tsx)**  
  - Loading: Loader2 spinner.  
  - Empty/Error: Toast/log.  
  - Skeleton: Cards/charts grid.

- **My venues `/my/venues` (MyVenues.tsx)**  
  - Loading: Loader2 + “Loading your venues…”.  
  - Empty: Empty list text.  
  - Error: Toast/log.  
  - Skeleton: List/grid skeleton.

- **My venue edit `/my/venues/:slug` (MyVenueEdit.tsx)**  
  - Loading: Loader2 + “Loading venue…”; spinners for events CRUD.  
  - Empty/Error: Toast/log.  
  - Skeleton: Form blocks + events list skeleton.

- **Admin reports `/admin/reports` (AdminReports.tsx)**  
  - Loading: spinner/text while checking admin; “Loading reports…” and “Loading moderation context…”.  
  - Empty: Empty queue text.  
  - Error: Toast/log.  
  - Skeleton: Admin list/table + detail pane skeleton.

- **Admin audit log `/admin/audit-log` (AdminAuditLog.tsx)**  
  - Loading: spinner while checking admin + “Loading moderation log…”.  
  - Empty: Empty log text.  
  - Error: Toast/log.  
  - Skeleton: Admin list/table.

- **Admin user moderation `/admin/users/:userId/moderation` (AdminUserModeration.tsx)**  
  - Loading: spinner while checking admin; section “Loading…” texts; action buttons disabled.  
  - Empty: Empty tables.  
  - Error: Toast/log.  
  - Skeleton: Admin list/detail + warning dialog skeleton.

- **Admin venues list/edit `/admin/venues`, `/admin/venues/:slug` (AdminVenuesList/AdminVenueEdit.tsx)**  
  - Loading: Loader2 + “Loading venue(s)…”; owners/events spinners.  
  - Empty/Error: Toast/log.  
  - Skeleton: Admin list/form + events list skeleton.

- **Auth `/auth` (Auth.tsx)**  
  - Loading: `LoadingState` while auth loads; buttons show “Opening Google…” when pending.  
  - Empty/Error: Auth errors toast/log.  
  - Skeleton: Auth form skeleton (optional).

### Section-level patterns
- Comments: “Loading comments…” text in `CatchComments.tsx`; delete state text. → Skeleton: comments list.
- Notifications bell: Loader2 for loading/mark/clear. → Skeleton: notification list.
- Leaderboard (component): inline loading state; cards/table. → Skeleton: leaderboard rows.
- Catch form sub-sections (tactics/location): “Loading …” texts in selects. → Skeleton: select rows.
- Avatar uploads/FishUploader: Loader2 while uploading/rating. → Skeleton: image/input placeholders.

### Rollout order (priority)
1) Index (landing)  
2) Feed + Catch detail  
3) Venues index + Venue detail  
4) Profile + Sessions + Admin suites (reports/moderation/audit/venues)
