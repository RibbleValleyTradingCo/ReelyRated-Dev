# Page Audit — /my/venues/:slug

---

## Purpose
Owner management page for a specific venue’s details and settings.

---

## Dark Mode Contrast Checklist
Use `DARK-MODE-CONTRAST-CHECKLIST.md` as reference:
- [ ] Page background (`bg-background`)
- [ ] Card surfaces (`bg-card`, `border-border`)
- [ ] Primary text contrast (`text-foreground`)
- [ ] Secondary text (`text-muted-foreground`)
- [ ] Icons & UI elements

---

## Token Usage
Use `TOKEN-REFERENCE.md` as reference:
- [ ] No raw palette classes (`bg-white`, `text-slate-*`, etc.)
- [ ] Semantic tokens applied consistently
- [ ] Shadow and focus states tokenized (`shadow-card`, `ring-ring`)

---

## Code Quality
- [ ] Components are readable and maintainable
- [ ] No redundant or hacky logic
- [ ] Semantic HTML elements used
- [ ] React rendering patterns are optimized

---

## Accessibility
Use `ACCESSIBILITY-STANDARDS.md` as reference:
- [ ] Headings hierarchy (H1 → H2 → H3)
- [ ] Keyboard focus visible
- [ ] ALT text on all images/icons
- [ ] Form labels and aria attributes

---

## Security
Use `OWASP‑TOP‑10‑CHECKLIST.md` as reference:
- [ ] Auth and authorization enforced appropriately
- [ ] Inputs validated/sanitized
- [ ] Sensitive data not exposed in UI or logs
- [ ] CSRF-safe mutation patterns (if applicable)

---

## Charts & Data Visualizations (if applicable)
Use `CHART-STYLE-GUIDELINES.md` as reference:
- [ ] Background tokens for chart panels
- [ ] Axis/label contrast
- [ ] Legend readability
- [ ] Chart colors tokenized

---

## Responsive & Interaction Check
- [ ] Layout holds at mobile breakpoints
- [ ] Dark mode persists on orientation change
- [ ] Touch/hover states remain visible

---

## Performance
- [ ] Lazy loading used for heavy sections
- [ ] Images and media optimized
- [ ] Avoid unnecessary re-renders

---

## Notes
*(Leave blank — fill this in after review.)*

---

## Actions
*(Leave blank — fill in planned fixes here.)*
