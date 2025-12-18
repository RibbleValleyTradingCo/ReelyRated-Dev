**Loading / Empty / Error Inventory (v4)**  
Updated: 2025-12-17

### Page-level (current plan)
- **Landing `/` (Index.tsx)**  
  - Loading: stats cards use placeholders (“—”); no spinner.  
  - Empty/Error: N/A (static).

- **Feed `/feed` (Feed.tsx)**  
  - Loading: skeleton grid (FeedCardSkeleton) in content area; header/filters stay real.  
  - Empty: Empty feed text.  
  - Error: Toast/log.

- **Venues index `/venues` (VenuesIndex.tsx)**  
  - Loading: PageSpinner in content area.  
  - Empty: “No venues” block.  
  - Error: Console/log only.

- **Venue detail `/venues/:slug` (VenueDetail.tsx)**  
  - Loading: PageSpinner in content area.  
  - Empty: Not-found card.  
  - Errors: Toast/log.

- **Catch detail `/catch/:id` (CatchDetail.tsx)**  
  - Loading: PageSpinner in content area.  
  - Empty: N/A.  
  - Error: Toast/log; inaccessible triggers redirect/toast.

- **Add catch `/add-catch` (AddCatch.tsx)**  
  - Loading: PageSpinner while checking auth/admin; subfetch spinners remain.  
  - Empty/Error: Toast/log.

- **Profile `/profile/:slug` (Profile.tsx)**  
  - Loading: PageSpinner; follow/block buttons may show sub-state.  
  - Empty: Sections empty as data dictates.  
  - Error: Toast/log; blocked-view stubs.

- **Profile settings `/settings/profile` (ProfileSettings.tsx)**  
  - Loading: PageSpinner; button-level spinners remain.  
  - Empty: Blocked list empty text.  
  - Error: Toast/log.

- **Sessions `/sessions` (Sessions.tsx)**  
  - Loading: PageSpinner.  
  - Empty: Empty list text.  
  - Error: Toast/log.

- **Search `/search` (Search.tsx)**  
  - Loading: Button-level spinner only.  
  - Empty: No results text.  
  - Error: Toast/log.

- **Insights `/insights` (Insights.tsx)**  
  - Loading: PageSpinner.  
  - Empty/Error: Toast/log.

- **My venues `/my/venues` (MyVenues.tsx)**  
  - Loading: PageSpinner.  
  - Empty: Empty list text.  
  - Error: Toast/log.

- **My venue edit `/my/venues/:slug` (MyVenueEdit.tsx)**  
  - Loading: PageSpinner; subfetch spinners remain.  
  - Empty/Error: Toast/log.

- **Admin reports `/admin/reports` (AdminReports.tsx)**  
  - Loading: PageSpinner for admin check/load.  
  - Empty: Empty queue text.  
  - Error: Toast/log.

- **Admin audit log `/admin/audit-log` (AdminAuditLog.tsx)**  
  - Loading: PageSpinner for admin check/load.  
  - Empty: Empty log text.  
  - Error: Toast/log.

- **Admin user moderation `/admin/users/:userId/moderation` (AdminUserModeration.tsx)**  
  - Loading: PageSpinner for admin check/load; actions show sub-state.  
  - Empty: Empty tables.  
  - Error: Toast/log.

- **Admin venues list/edit `/admin/venues`, `/admin/venues/:slug` (AdminVenuesList/AdminVenueEdit.tsx)**  
  - Loading: PageSpinner; owners/events may show sub-state.  
  - Empty/Error: Toast/log.

- **Auth `/auth` (Auth.tsx)**  
  - Loading: `LoadingState` while auth loads; button-level spinners for Google.  
  - Empty/Error: Auth errors toast/log.

### Section-level patterns
- Comments: “Loading comments…” text in `CatchComments.tsx`; delete state text.  
- Notifications bell: Button-level spinners for loading/mark/clear.  
- Leaderboard (component): Inline loading state; cards/table.  
- Catch form sub-sections (tactics/location): “Loading …” texts in selects.  
- Avatar uploads/FishUploader: Button-level spinners while uploading/rating.

### Note
- Page-level loading now uses PageSpinner (content-only) except `/feed`, which keeps its skeleton grid.
