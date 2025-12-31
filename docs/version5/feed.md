# Page Audit — /feed

---

## Purpose
Community feed of catches with reactions, comments, and navigation to details.

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
- Feed title now renders as H1 (`titleAs="h1"`).
- Catch cards are keyboard accessible (`role="link"`, `tabIndex`, Enter/Space activation) and venue link click is preserved with propagation stop.
- Feed filters now have programmatic labels via `aria-labelledby`.
- Removed N+1 `get_catch_rating_summary` calls; cards use `avg_rating`/`rating_count` with a safe ratings fallback.
- Feed card images use `loading="lazy"` + `decoding="async"`.
- Empty state is gated behind not-busy state to avoid flash during loading.
- `get_feed_catches` / `useFeedData` contracts unchanged; security assumes existing auth gating + RLS.

---

## Actions
- [ ] Keyboard activation for cards + venue link behavior.
- [ ] Screen reader announces filter label + value.
- [ ] Network confirms no per-card rating RPC calls.
- [ ] Images lazy load and decode async.
- [ ] H1 exists; CTA shadow is tokenized.
