# Page Audit — /

---

## Purpose
Landing page introducing ReelyRated and guiding users to key actions.

---

## Dark Mode Contrast Checklist
Use `DARK-MODE-CONTRAST-CHECKLIST.md` as reference:
- [x] Page background (`bg-background`)
- [x] Card surfaces (`bg-card`, `border-border`)
- [x] Primary text contrast (`text-foreground`)
- [x] Secondary text (`text-muted-foreground`)
- [x] Icons & UI elements

---

## Token Usage
Use `TOKEN-REFERENCE.md` as reference:
- [x] No raw palette classes (`bg-white`, `text-slate-*`, etc.)
- [x] Semantic tokens applied consistently
- [x] Shadow and focus states tokenized (`shadow-card`, `ring-ring`)

---

## Code Quality
- [x] Components are readable and maintainable
- [x] No redundant or hacky logic
- [x] Semantic HTML elements used
- [x] React rendering patterns are optimized

---

## Accessibility
Use `ACCESSIBILITY-STANDARDS.md` as reference:
- [x] Headings hierarchy (H1 → H2 → H3)
- [x] Keyboard focus visible
- [x] ALT text on all images/icons
- [x] Form labels and aria attributes

---

## Security
Use `OWASP‑TOP‑10‑CHECKLIST.md` as reference:
- [x] Auth and authorization enforced appropriately
- [x] Inputs validated/sanitized
- [x] Sensitive data not exposed in UI or logs
- [x] CSRF-safe mutation patterns (if applicable)

---

## Charts & Data Visualizations (if applicable)
Use `CHART-STYLE-GUIDELINES.md` as reference:
- [ ] N/A — no charts on this page

---

## Responsive & Interaction Check
- [x] Layout holds at mobile breakpoints
- [x] Dark mode persists on orientation change
- [x] Touch/hover states remain visible

---

## Performance
- [x] Lazy loading used for heavy sections
- [x] Images and media optimized
- [x] Avoid unnecessary re-renders

---

## Notes
- Community stats are now DB-maintained in real time (public-only catches: deleted_at IS NULL and visibility='public'); compute cost is shifted to DB writes.
- Landing page fetches stats once per visit via `get_community_stats()` (no polling or realtime UI subscriptions).
- Stats tables are locked down (explicit revokes + RLS/forced RLS); the public-safe RPC still works.
- Canonical species options now live in `public.species` with SELECT-only access for anon/auth (RLS + ACL hardening).
- /feed and landing leaderboard use `useSpeciesOptions` (RPC-backed) with a static fallback; the landing species dropdown now matches /feed via `FeedSelect`.
- Spotlight/stats gradient uses explicit palette values (intentional token exception) and overrides light/dark mode for that section only.
- Leaderboard rows are keyboard accessible; internal CTAs use React Router `Link`; spotlight refreshes every 5 minutes to reduce background noise.
- Landing (/) leaderboard uses periodic refresh (3 minutes) with realtime disabled via `useLeaderboardRealtime` options; /leaderboard remains realtime by default.
- PulsingDot has consistent sizing and improved visibility; pulse colors are theme-inverted (light = white, dark = black).
- Spotlight card no longer implies clickability (no pointer cursor or click-like hover cues).
- Changes are additive (new tables/RPCs) and do not modify existing core catch/venue RPC contracts.

---

## Actions
- [ ] Stats render correctly and fetch only once per page load (verify network).
- [ ] Insert/update/delete a public catch and confirm `get_community_stats()` reflects changes immediately.
- [ ] Anon/auth cannot SELECT from `community_stats_*` tables (permission denied), but RPC works.
- [ ] Species dropdown on / matches /feed visually and options match DB labels/order.
- [ ] Spotlight refresh is periodic (no realtime spikes).
- [ ] Keyboard: leaderboard links focus/activate correctly.
- [ ] PulsingDot pulses invert correctly (light = white, dark = black) and remain visible.
- [ ] Landing leaderboard refreshes about every 3 minutes with no realtime subscription.
- [ ] /leaderboard still uses realtime behavior (if expected).
