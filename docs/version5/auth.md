# Page Audit — /auth

---

## Purpose
Authentication page for sign in, sign up, and account recovery.

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
- Generic auth/reset messaging now avoids account enumeration (“If an account exists…” pattern).
- Raw palette classes removed; tokenized link/notice styles used for dark mode consistency.
- Inline errors wired via `aria-describedby` and announced with `role="alert"` across auth views.
- “Forgot password?” now has clear focus-visible styling.
- Deleted-account handling unchanged; manual check recommended.
- Future improvement (React Router): /auth already uses URL state for the reset flow (`?reset_password=1`). In a future pass, consider adding a lightweight `?mode=` query param (e.g., signin, signup, forgot) to deep-link directly to the relevant auth view/tab and improve back/forward navigation. Keep this minimal to avoid added complexity.

---

## Actions
- [ ] Verify dark/light mode contrast and no raw palette classes.
- [ ] Verify reset request message is identical for existing/non-existing emails.
- [ ] Verify screen reader announcements for inline errors.
- [ ] Verify keyboard focus ring on “Forgot password?”.
- [ ] Verify deleted-account sign-in behavior matches expected product behavior.
