# Page Audit — /admin/venues

---

## Purpose
Admin list and search for venues with edit access.

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
- Page title now renders as an H1 via `titleAs="h1"`.
- Search input now has a programmatic label (`label` + `id`) for screen readers.
- Admin gating shows explicit loading and unauthorized states (no blank screen).
- List fetching is hardened with functional updates and a request-id/active-query guard to prevent race/stale interleaving.
- Debounced effect now has proper dependencies (no lint suppression).
- The `get_venues` RPC contract/params were not changed.
- React Query (future pass): Not currently used on /admin/venues. Consider adopting React Query (e.g., an infinite query pattern) if we want standardized caching, background refetch, and simpler loading/error handling across admin tools. Note that ROI is modest for this admin-only list unless stale data or cross-page caching becomes a real need.
- React Router (future pass): React Router is currently used for `?q=` syncing and navigation, while pagination/offset is local state. Consider syncing pagination/list position to the URL only if admins need shareable deep links or reliable back/forward restoration of list position; otherwise keep local state to avoid added complexity/brittleness.

---

## Actions
- [ ] Verify H1 + search label in the accessibility tree.
- [ ] Verify loading/unauthorized states render.
- [ ] Verify rapid typing doesn’t interleave results and “Load more” appends correctly.
- [ ] Verify `?q=` sync + debounce still works.
