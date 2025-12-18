**V4 Scope & Guardrails (UI-only)**  
Updated: 2025-12-17

## In Scope (UI-only)
- Visual/structural updates to React components and Tailwind styles.
- Shared layout/navigation consistency (Navbar + Layout) without remounts.
- Skeleton/shimmer loading states that are content-only.
- Spacing/typography/card/chip/button refinements using existing data.
- Page section reflows (no logic/flow changes).

## Out of Scope
- Supabase migrations, RPC/function changes, RLS/policies.
- Data fetching logic, hooks, dependencies, redirects, caching.
- Backend auth/session handling.
- Route guard behavior beyond visual loading (RequireAuth/DeletedAccountGate).
- New routes or removing existing routes without approval.

## PR Checklist (must-keep)
- [ ] No edits to `supabase/`, migrations, RPC SQL, or RLS.
- [ ] No changes to data-fetching (queries, hook deps, effects, redirects).
- [ ] Navbar remains mounted during navigation; Layout intact.
- [ ] Loading uses skeletons (no full-screen spinners over navbar).
- [ ] Mobile-first: verify iPhone viewport for spacing/overlap.
- [ ] Desktop regression check on key pages (Landing, Venues, Feed, Catch, Profile).
- [ ] Screenshots for visual changes (mobile + desktop) added to `docs/version4/visual-baseline/` when applicable.
- [ ] TODOs noted in docs when info unknown (no guesses).
