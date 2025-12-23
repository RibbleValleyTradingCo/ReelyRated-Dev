# Manual Test Checklist — Venue Redesign (v4)

Owner: ReelyRated team

This checklist is the **hands-on QA pass** for the venue page redesign work in this phase.

Scope for this phase (UI-only)

- Section headers standardisation (SectionHeader component)
- Hero + ratings redesign (inline rating identity + picker)
- Pill cleanup (strict discipline)
- Map full-width treatment
- UI states (loading / empty / error) for the above

Non-goals

- No Supabase migrations / RPC changes
- No new backend data requirements
- No changes to business logic beyond UI state handling (optimistic/rollback, loading/empty/error rendering)

---

## Test environments

### Devices

- Mobile: iPhone sized (≈390×844) + one smaller Android size (≈360×800)
- Desktop: 1440px wide

### Browsers

- Chrome (latest)
- Safari (macOS) or iOS Safari

### Accounts

- Signed-out user
- Signed-in user (with and without an existing venue rating)

### Test venues

Have at least these venue data scenarios available (real or seeded):

1. **Full content**: hero image, rating data, record catch, stats, about text, plan/visit info, map coords/address, catches, events
2. **No ratings**: 0 ratings, no user rating
3. **User rated**: user has already rated this venue
4. **No hero image**: uses fallback background
5. **No record catch**
6. **No catches** (community empty)
7. **No events**
8. **Map missing / fails** (no coords or iframe blocked)

---

## Global smoke checks (before details)

- [ ] Venue page loads without console errors
- [ ] No layout shift/jumps during initial render (especially around hero/ratings)
- [ ] No “boxed-in” feel: spacing rhythm looks consistent section-to-section
- [ ] Page is usable and readable at minimum mobile width (no horizontal scroll)

---

## A. Visual consistency — Section headers

- [ ] All major sections use the same H2 styling (font, weight, colour, spacing)
- [ ] No coloured/filled header backgrounds
- [ ] No “special case” H2 styling remains
- [ ] H2 order is semantic (H1 → H2 → H3) and not skipped
- [ ] Section spacing is consistent (no random extra margins)

---

## B. Hero + Ratings (core focus)

### Hero rendering

- [ ] Hero displays venue name (H1) and supporting metadata cleanly
- [ ] If hero photo exists: readable text with overlay
- [ ] If hero photo missing: fallback background looks intentional (not broken)
- [ ] Action strip at bottom of hero is visible and does not overlap text

### Average rating display

- [ ] Stars reflect average rating (correct rounding rules as implemented)
- [ ] Summary text shows: `X.X · N ratings` (handles singular/plural)
- [ ] For 0 ratings: displays `0.0 · 0 ratings` (no “No ratings yet” placeholder)

### Signed-out behaviour

- [ ] Signed-out user sees rating summary but cannot submit a rating
- [ ] If “Rate this venue” is shown while signed out, it should route to auth OR show a friendly sign-in prompt (no silent failure)

### Signed-in behaviour — first-time rating

- [ ] Signed-in user with no rating sees “Rate this venue” control
- [ ] Clicking opens the rating picker (overlay/modal)
- [ ] Hover/press star interactions work on desktop and mobile
- [ ] Cancel closes picker without changing UI state
- [ ] Submit triggers **optimistic UI**:
  - [ ] Immediately shows `You rated this X stars`
  - [ ] Average/total update immediately (or update indicator shown)
  - [ ] No flash of “0 ratings / no ratings yet” after submit

### Signed-in behaviour — existing rating

- [ ] User who already rated sees `You rated this X stars`
- [ ] “Change” control is present
- [ ] “Change” opens picker with current rating pre-selected

### Rating submission error handling

Simulate failure (offline, forced error, blocked request):

- [ ] On submit failure, UI reverts to previous values
- [ ] User sees a clear error message/toast
- [ ] User can retry submission

### Ratings persistence

- [ ] Refresh page after successful submit: user rating persists and displays correctly
- [ ] Average/total values are consistent with backend after refresh

---

## C. Venue Record

- [ ] Record card is prominent and styled correctly (gold/amber accent)
- [ ] Layout stacks correctly on mobile (image above text if needed)
- [ ] If record catch missing: displays empty state text (e.g., “No venue record yet — be the first!”) and CTA behaviour is correct

---

## D. Stats & Records row

- [ ] Mobile layout is 2×2 grid (no squashed cards)
- [ ] Desktop layout is 4 columns
- [ ] Values render correctly and labels are readable
- [ ] Skeleton/loading state appears while stats load (if applicable)
- [ ] Empty/error state matches `04-UI-STATES-EMPTY-LOADING-ERROR.md`

---

## E. About section

- [ ] Mobile: text clamps after expected lines with “Read more”
- [ ] Toggle expands/collapses without layout glitches
- [ ] Desktop: full text shown by default (if that’s the spec)
- [ ] Key chips limited to max 2–3; no pill spam

---

## F. Plan Your Visit / Quick Facts

- [ ] Pricing, contact, best-for, facilities are scannable and not pill-based
- [ ] Facilities render as icon + text (wraps nicely on mobile)
- [ ] External links (website) work and have `rel="noopener noreferrer"`
- [ ] CTAs are reachable and not duplicated/confusing

---

## G. Map — full width

- [ ] Map section header is padded; map container bleeds edge-to-edge
- [ ] No horizontal padding on the iframe container
- [ ] On mobile: map touches screen edges (no white gutters)
- [ ] “Open in Google Maps” control is visible and tappable
- [ ] Map iframe has a `title` attribute for accessibility

### Map failure handling

- [ ] If map cannot load: fallback renders (address text + maps link)
- [ ] Page doesn’t collapse or leave a broken blank region

---

## H. Community / Recent Catches (banded section #1)

- [ ] Section uses banded background (gray-50) and still feels light
- [ ] Tabs switch states correctly (or behave as currently implemented)
- [ ] Catch cards:
  - [ ] Mobile: single-column
  - [ ] Desktop: grid (2–3 columns as designed)
  - [ ] Images have alt text
  - [ ] Only one tag badge per catch (e.g., Venue Record/PB)

### Empty / loading / error

- [ ] Loading state shows skeletons, not “No catches”
- [ ] Empty state message is friendly + CTA to log a catch
- [ ] Error state provides retry (if applicable)

---

## I. Events (banded section #2)

- [ ] Section uses banded background (blue-50) and looks intentional
- [ ] Max 3 events displayed (if implemented)
- [ ] Event type badge appears (max 1 per event)
- [ ] CTAs are visible and tappable

### Empty / loading / error

- [ ] If no events: section hides OR shows minimal empty state (as per spec)
- [ ] Loading state uses skeletons
- [ ] Error state renders gracefully

---

## J. Pill discipline audit

Do a final scroll and visually confirm:

- [ ] No pills for location, facilities, pricing, generic facts
- [ ] Pills only for: event type, catch tag, status
- [ ] No section header “chips” masquerading as titles

---

## K. Accessibility & interaction

- [ ] Keyboard navigation reaches rating controls, tabs, CTAs
- [ ] Focus states are visible
- [ ] Buttons have minimum touch size (≈44px)
- [ ] Contrast is acceptable (especially hero text)
- [ ] Icons used with text labels (no icon-only critical actions)

---

## L. Regression checks

- [ ] Existing venue page actions still work (booking/call/directions or equivalents)
- [ ] Navigation back/forward doesn’t break state
- [ ] Auth-required actions behave correctly
- [ ] No new console warnings/errors introduced

---

## Notes / Findings

Record issues here as you test:

- Date/time:
- Browser/device:
- Venue slug:
- Steps to reproduce:
- Expected:
- Actual:
- Screenshots:

---

## Sign-off

- [ ] Mobile pass complete
- [ ] Desktop pass complete
- [ ] Cross-browser pass complete
- [ ] All P0 issues fixed or explicitly deferred
