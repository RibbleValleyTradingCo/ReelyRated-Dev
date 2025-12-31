# Page Audit — /insights

---

## Purpose
Insights dashboard with analytics on catches and trends.

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
- [x] Background tokens for chart panels
- [x] Axis/label contrast
- [x] Legend readability
- [x] Chart colors tokenized

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
- Main title now renders as H1 via `SectionHeader` (`titleAs="h1"`).
- Filter controls are programmatically labeled (date range, session, venue, custom range).
- Charts expose screen-reader summaries (`role="img"` + aria labels/descriptions) for trend and distribution views.
- Insights data prefers `get_insights_aggregates()` (server-side aggregation) and falls back to client aggregation with a gentle notice if the RPC fails.
- RPC is additive and scoped to `auth.uid()`; existing catch/session data flows remain as fallback.

---

## Actions
- [ ] Verify H1 renders once and heading order is correct.
- [ ] Screen reader announces filter labels for date range/session/venue/custom range.
- [ ] Chart containers announce labels/descriptions in a screen reader.
- [ ] Network shows `get_insights_aggregates()` and avoids full catch downloads in normal use.
- [ ] Force RPC failure to confirm fallback notice and client aggregates still render.
- [ ] Check chart contrast/legibility in light and dark mode.
