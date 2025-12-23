# FetchPriority Warning Investigation

## Summary
- The React warning came from using the camelCase `fetchPriority` prop on a DOM `<img>` element. React 18 treats that as an unknown DOM property and logs a warning.
- The warning no longer appears because the only remaining usage is the lowercase `fetchpriority` attribute in `VenueHero.tsx`, which React passes through as a custom attribute without warning.

## Findings
### Usage scan
Command used:
```
rg -n "fetchPriority|fetchpriority" src docs
```
Results:
- `src/pages/venue-detail/components/VenueHero.tsx`:
  - `fetchpriority="high"` (lowercase attribute)
  - Comment: `@ts-expect-error fetchpriority is supported in modern browsers but not in TS lib yet.`
- `docs/version4/venue-redesign/96-VENUE-DETAIL-HARDENING-PLAN.md`:
  - Note referencing `fetchpriority="high"`

No camelCase `fetchPriority` usage exists in the repo now.

### Component responsible
The warning originated from the hidden preload `<img>` in:
`src/pages/venue-detail/components/VenueHero.tsx`

This element only renders when `activeHeroImage` exists, which is why the warning used to appear only in some render paths.

## React version context
`package.json`:
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`

React 18.x does **not** recognize `fetchPriority` as a valid DOM prop, so camelCase `fetchPriority` will always warn. The lowercase `fetchpriority` attribute is the correct way to express it in React today.

## Why the warning disappeared
One of these changed:
- The prop was renamed from `fetchPriority` → `fetchpriority` (current state).
- The preload `<img>` only renders when `activeHeroImage` exists, so in cases where no image was set, the warning would not show.

Current code uses lowercase `fetchpriority`, so React no longer logs the warning.

## Recommendation
No code change required right now. The current usage is best practice for React 18:
- Keep `fetchpriority="high"` (lowercase) on the preload `<img>`.
- If we decide to rely solely on `new Image()` preloading, we can remove the attribute entirely.

## Regression guard
- **Rule of thumb**: never use camelCase `fetchPriority` on DOM nodes in this codebase while on React 18.
- **QA check**: open `/venues/:slug` and ensure the console has no “React does not recognize the fetchPriority prop…” warning.
