**Route Access Matrix (v4 UI)**  
Updated: 2025-12-17

| Route | Anon | Authed | Admin | Expected behavior | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | Render | Render | Render | Landing renders for all | Navbar via Layout |
| `/venues` | Render | Render | Render | Directory renders | Public |
| `/venues/:slug` | Render | Render | Render | Venue detail renders | Public |
| `/leaderboard` | Render | Render | Render | Leaderboard renders | Public |
| `/feed` | Redirect to `/auth` | Render | Render | Auth gate via RequireAuth | Layout shell persists |
| `/add-catch` | Redirect to `/auth` | Render | Render | Auth gate | CTA/logging |
| `/catch/:id` | Redirect to `/auth` | Render | Render | Auth gate | Redirect + toast on inaccessible |
| `/profile/:slug` | Redirect to `/auth` | Render | Render | Auth gate | |
| `/settings/profile` | Redirect to `/auth` | Render | Render | Auth gate | |
| `/sessions` | Redirect to `/auth` | Render | Render | Auth gate | |
| `/search` | Redirect to `/auth` | Render | Render | Auth gate | |
| `/insights` | Redirect to `/auth` | Render | Render | Auth gate | |
| `/my/venues` | Redirect to `/auth` | Render | Render | Auth gate | Owner tools |
| `/my/venues/:slug` | Redirect to `/auth` | Render | Render | Auth gate | Owner edit |
| `/admin/reports` | Redirect to `/auth` | Allowed if admin | Allowed | Auth gate; admin enforcement inside page | Admin-only behavior in page |
| `/admin/audit-log` | Redirect to `/auth` | Allowed if admin | Allowed | Auth gate; admin enforcement inside page | |
| `/admin/users/:userId/moderation` | Redirect to `/auth` | Allowed if admin | Allowed | Auth gate; admin enforcement inside page | |
| `/admin/venues` | Redirect to `/auth` | Allowed if admin | Allowed | Auth gate; admin enforcement inside page | |
| `/admin/venues/:slug` | Redirect to `/auth` | Allowed if admin | Allowed | Auth gate; admin enforcement inside page | |
| `/auth` | Render | Render (but typically redirect logic inside) | Render | Auth page; no navbar | Outside Layout |
| `/account-deleted` | Render | Render | Render | Account deleted page; no navbar | Outside Layout |
| `*` | Render | Render | Render | 404 page | |

Guards:
- `RequireAuth` wraps protected/admin routes (defined in `src/App.tsx`).
- Layout wraps Navbar + Suspense (`RouteSkeleton`) + `DeletedAccountGate` around outlet.
- Admin checks happen inside admin pages (pages enforce admin role).
