**Loading / Empty / Error Inventory (v4)**  
Updated: 2025-12-17

| Page | Loading | Empty | Error | Recommended skeleton |
| --- | --- | --- | --- | --- |
| Landing (`/`) | Currently static; no loader | N/A | N/A | FeatureCard + hero skeleton (future) |
| VenuesIndex | Loader2 + text | “No venues” block | Console/log | VenueCardSkeleton grid |
| VenueDetail | Loader2 center | Not-found card | Toast/error inside page | Hero + actions + sidebar + catches skeleton |
| Feed | `LoadingState` spinner | Empty feed text | Toast/log | FeedCardSkeleton list |
| CatchDetail | “Loading…” text | N/A | Toast/error | CatchDetailSkeleton (hero, sidebar, comments) |
| AddCatch | Form waits | N/A | Toast/error | Form skeleton blocks |
| Profile | Loader2 | Empty sections | Toast/log | ProfileHeaderSkeleton + grid |
| ProfileSettings | Loader2 (saving) | N/A | Toast/error | Form skeleton |
| Sessions | Loader2 | Empty list | Toast/log | List/table skeleton |
| Search | Loader2 in form | No results text | Toast/log | List skeleton |
| Insights | Loader2 | N/A | Toast/log | Cards/charts skeleton |
| MyVenues | Loader2 | Empty list | Toast/log | List skeleton |
| MyVenueEdit | Loader2 | N/A | Toast/log | Form skeleton |
| AdminReports | Loading block | Empty queue text | Toast/log | Admin list skeleton |
| AdminAuditLog | Loading block | Empty | Toast/log | Admin list skeleton |
| AdminUserModeration | Loading block | Empty tables | Toast/log | Admin list/detail skeleton |
| AdminVenuesList/Edit | Loader2 | Empty | Toast/log | Admin list/form skeleton |
| Auth | Built-in auth flow | N/A | Toast | Auth form skeleton (optional) |

TODO: Confirm exact empty/error UIs per page; replace remaining spinners with skeleton patterns listed above.
