**Route Access Matrix (v4 UI)**  
Updated: 2025-12-17

| Route | Anon | Authed (non-admin) | Admin | Expected behavior | Enforced by | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Render | Render | Render | Landing renders for all | Layout | Navbar via Layout |
| `/venues` | Render | Render | Render | Directory renders | Layout | Public |
| `/venues/:slug` | Render | Render | Render | Venue detail renders | Layout | Public |
| `/leaderboard` | Render | Render | Render | Leaderboard renders | Layout | Public |
| `/feed` | Redirect to `/auth` | Render | Render | Auth gate via RequireAuth | RequireAuth + Layout | Layout shell persists |
| `/add-catch` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | CTA/logging |
| `/catch/:id` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | Redirect + toast on inaccessible |
| `/profile/:slug` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | |
| `/settings/profile` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | |
| `/sessions` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | |
| `/search` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | |
| `/insights` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | |
| `/my/venues` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | Owner tools |
| `/my/venues/:slug` | Redirect to `/auth` | Render | Render | Auth gate | RequireAuth + Layout | Owner edit |
| `/admin/reports` | Redirect to `/auth` | Denied (admin-only; NotAuthorized/redirect/error) | Allowed | Auth gate; admin enforcement inside page | RequireAuth + Page-level admin check | Admin-only behavior in page |
| `/admin/audit-log` | Redirect to `/auth` | Denied (admin-only) | Allowed | Auth gate; admin enforcement inside page | RequireAuth + Page-level admin check | |
| `/admin/users/:userId/moderation` | Redirect to `/auth` | Denied (admin-only) | Allowed | Auth gate; admin enforcement inside page | RequireAuth + Page-level admin check | |
| `/admin/venues` | Redirect to `/auth` | Denied (admin-only) | Allowed | Auth gate; admin enforcement inside page | RequireAuth + Page-level admin check | |
| `/admin/venues/:slug` | Redirect to `/auth` | Denied (admin-only) | Allowed | Auth gate; admin enforcement inside page | RequireAuth + Page-level admin check | |
| `/auth` | Render | Render (may redirect if already authed) | Render | Auth page; no navbar | Outside Layout | |
| `/account-deleted` | Render | Render | Render | Account deleted page; no navbar | Outside Layout | |
| `*` | Render | Render | Render | 404 page | Layout | |

Guards:
- `RequireAuth` wraps protected/admin routes (defined in `src/App.tsx`).
- Layout wraps Navbar + Suspense (`RouteSkeleton`) + `DeletedAccountGate` around outlet.
- Admin checks happen inside admin pages (pages enforce admin role).
- Suspense boundary lives inside Layout; navbar stays mounted across route transitions.
