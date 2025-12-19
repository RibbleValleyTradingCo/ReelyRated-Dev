**Page Inventory – ReelyRated v3**  
_Generated: 2025-12-17 (local time)_

## Legend

- **Access:** Public | Authed | Admin-only
- **Gate:** RequireAuth = auth gate; Layout keeps navbar; DeletedAccountGate inside layout (navbar stays); Admin checks happen inside pages/RPCs.

## Route Inventory

### Public marketing/browse

| Route           | Access | Gate   | Component                       | Nav entry            | Notes             |
| --------------- | ------ | ------ | ------------------------------- | -------------------- | ----------------- |
| `/`             | Public | Layout | `src/pages/Index.tsx`           | Navbar “Home” (logo) | Landing/marketing |
| `/venues`       | Public | Layout | `src/pages/VenuesIndex.tsx`     | Navbar “Venues”      | Public browse     |
| `/venues/:slug` | Public | Layout | `src/pages/VenueDetail.tsx`     | Deep link            | Public detail     |
| `/leaderboard`  | Public | Layout | `src/pages/LeaderboardPage.tsx` | Navbar “Leaderboard” | Public            |

### Auth core social (feed/catch/profile/sessions)

| Route               | Access | Gate        | Component                       | Nav entry               | Notes              |
| ------------------- | ------ | ----------- | ------------------------------- | ----------------------- | ------------------ |
| `/feed`             | Authed | RequireAuth | `src/pages/Feed.tsx`            | Navbar “Feed”           | Authenticated feed |
| `/search`           | Authed | RequireAuth | `src/pages/Search.tsx`          | Navbar “Explore/Search” | Requires auth      |
| `/add-catch`        | Authed | RequireAuth | `src/pages/AddCatch.tsx`        | Header CTA / FAB        | Authenticated      |
| `/catch/:id`        | Authed | RequireAuth | `src/pages/CatchDetail.tsx`     | Deep link (cards)       | Needs id           |
| `/profile/:slug`    | Authed | RequireAuth | `src/pages/Profile.tsx`         | Navbar profile / deep   | Authenticated      |
| `/settings/profile` | Authed | RequireAuth | `src/pages/ProfileSettings.tsx` | Profile menu            | Authenticated      |
| `/sessions`         | Authed | RequireAuth | `src/pages/Sessions.tsx`        | Navbar “Sessions”       | Authenticated      |
| `/insights`         | Authed | RequireAuth | `src/pages/Insights.tsx`        | Navbar “Insights”       | Authenticated      |

### Admin

| Route                             | Access     | Gate                                  | Component                           | Nav entry         | Notes             |
| --------------------------------- | ---------- | ------------------------------------- | ----------------------------------- | ----------------- | ----------------- |
| `/admin/reports`                  | Admin-only | RequireAuth (admin check inside page) | `src/pages/AdminReports.tsx`        | Navbar admin menu | Admin list/review |
| `/admin/audit-log`                | Admin-only | RequireAuth (admin check inside page) | `src/pages/AdminAuditLog.tsx`       | Navbar admin menu | Admin audit       |
| `/admin/users/:userId/moderation` | Admin-only | RequireAuth (admin check inside page) | `src/pages/AdminUserModeration.tsx` | Deep/admin links  | User moderation   |
| `/admin/venues`                   | Admin-only | RequireAuth (admin check inside page) | `src/pages/AdminVenuesList.tsx`     | Navbar admin menu | Venues admin      |
| `/admin/venues/:slug`             | Admin-only | RequireAuth (admin check inside page) | `src/pages/AdminVenueEdit.tsx`      | Deep/admin links  | Venue edit        |

### Auth / account

| Route              | Access | Gate                  | Component                      | Nav entry         | Notes     |
| ------------------ | ------ | --------------------- | ------------------------------ | ----------------- | --------- |
| `/auth`            | Public | None (outside layout) | `src/pages/Auth.tsx`           | Buttons/redirects | No navbar |
| `/account-deleted` | Public | None (outside layout) | `src/pages/AccountDeleted.tsx` | Redirect only     | No navbar |
| `*`                | Public | Layout                | `src/pages/NotFound.tsx`       | N/A               | 404       |

### “Deep links” / secondary

| Route              | Access | Gate        | Component                   | Nav entry       | Notes       |
| ------------------ | ------ | ----------- | --------------------------- | --------------- | ----------- |
| `/my/venues`       | Authed | RequireAuth | `src/pages/MyVenues.tsx`    | Deep/admin menu | Owner tools |
| `/my/venues/:slug` | Authed | RequireAuth | `src/pages/MyVenueEdit.tsx` | Deep/admin menu | Owner edit  |

## Non-route UI surfaces (modal/drawer/panels)

- Report modals: `src/components/ReportButton` used on CatchDetail and CatchComments.
- Admin warning dialog: in `src/pages/AdminUserModeration.tsx`.
- Mobile nav drawer: `src/components/MobileMenu.tsx`.
- Various delete/edit dialogs on CatchDetail/AddCatch/ProfileSettings/Admin pages.

## Missing / ambiguous

- Admin checks are enforced inside admin pages (RequireAuth only guards auth). Ensure admin role present for admin routes.

## Suggested QA order (top 10)

1. `/auth` (no navbar)
2. `/` landing
3. `/venues` → `/venues/:slug`
4. `/feed` (auth)
5. `/catch/:id` (auth)
6. `/profile/:slug` (auth) + `/settings/profile`
7. `/add-catch` (auth)
8. `/admin/reports` (admin)
9. `/admin/users/:userId/moderation` (admin)
10. `/account-deleted` redirect path
