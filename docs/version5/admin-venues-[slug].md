# Page Audit — /admin/venues/:slug

---

## Purpose
Admin edit view for a venue’s metadata, owners, and events.

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
- Page title now renders as an H1 (`titleAs="h1"`).
- Metadata, event, and owner labels are now linked to their controls via `id`/`htmlFor`.
- Destructive actions (delete event/remove owner) use themed AlertDialogs instead of `window.confirm`.
- Admin access resolves with explicit loading and unauthorized states (no blank screen).
- RulesCard non-embedded variant now uses tokenized card styles (`bg-card`, `border-border`, `shadow-card`).
- Assumption: `isAdminUser` and admin RPCs enforce server-side authorization.
- Future improvement (React Query): Not currently used for this page’s fetching. Consider adopting React Query in a future pass if we want standardized caching/background refetch and consistent invalidation patterns across admin tools (venues/owners/events), but the ROI may be limited for a form-heavy, admin-only page unless we see stale-state or refetch complexity.
- Future improvement (React Router URL syncing): React Router is used for routing/slug/navigation, but page UI state is local. Consider URL params for deep-linking to a specific section/event (e.g., `?section=events&eventId=...`) only if admins need shareable links; note the added complexity with unsaved-change blockers.

---

## Actions
- [ ] Verify the page title renders as a single H1 in the accessibility tree.
- [ ] Verify labels click-to-focus for metadata and event fields (including facilities and payment methods).
- [ ] Verify delete event/remove owner dialogs are keyboard accessible and theme-consistent.
- [ ] Verify admin loading/unauthorized states render (no blank screen).
- [ ] Verify RulesCard surfaces are token-consistent in light and dark mode.
