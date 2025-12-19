# ReelyRated v4 – UI Development Plan

Mobile-first UI polish for **a UK fishing community app**: log catches, plan sessions, discover venues, and compete on leaderboards.

---

## Current State

- ReelyRated already has a clean, fishing-themed look and clear navigation (**Feed, Venues, Leaderboard, Sessions, Explore/Search**).
- Strengths: clear CTAs (Log Catch / Add Catch), community surfaces (catches, comments, leaderboard), and a solid auth + role model (anglers, venue owners, admins).
- Gaps to address in v4:
  - Some pages still feel “app skeleton” rather than “flagship fishing product” (content density, hierarchy, empty-states).
  - Loading states still show spinners in places; we want **shimmering layout skeletons** that match the final layout.
  - The landing page can sell the purpose better: _why log catches, why follow anglers, why venues matter_.
  - Mobile-first “on the bank” polish: big touch targets, high outdoor contrast, resilient on poor connections.
  - Venue page (mobile) continuity bug: /venues/:slug can show a large blank gap mid-page (iPhone-sized viewports) due to nested full-height wrappers; fix this as a v4 prerequisite so the page scroll feels continuous.

---

## Goals

1. **Make every page feel intentionally designed for UK coarse fishing** (carp lakes, rivers, commercials, day tickets).
2. **Mobile-first**: thumb-friendly, readable outdoors, quick to scan, fast to load.
3. **Progressive enhancement**: desktop gets richer layouts (grids, sidebars, hover affordances) without creating a separate experience.
4. **Performance + perceived performance**: shimmer skeletons, image discipline, lazy loading, sensible empty states.

---

## Design Principles

- **On-the-water readability**: strong contrast, large type, minimal clutter, obvious primary action.
- **Community-first**: catches and anglers are the hero; venues are the “where”; sessions are the “plan”.
- **Trust & clarity**: clear privacy states (public/followers/private), clear permission messaging (no data leaks).
- **Consistent language** (UK tone):
  - “Log a Catch” (not “post”)
  - “Venue” / “Fishery”
  - “Session” (date + venue + notes)
  - “Peg / Swim” (optional)

---

## Visual Language

- **Palette**: deep water blues + reed greens + neutral stone/linen backgrounds (outdoor friendly).
- **Texture**: subtle grain/gradient, not heavy patterns (avoid noise on mobile).
- **Iconography**: simple line icons (hook, map pin, trophy, calendar).
- **Photography**: UK fisheries (lakes/rivers), natural light; avoid overly saturated stock imagery.

---

## Loading & Feedback Standards

We want **shimmer skeletons instead of spinners** wherever possible.

### Rules

- **Route transitions**: show a _content-only_ skeleton (navbar stays mounted).
- **Section loads**: skeleton matches the component layout (cards, lists, stats, comments).
- **Action loads** (buttons): disable + inline loading state inside the button.
- **Error states**: friendly “what happened” + “what you can do next” (retry, go back, report).

### Required skeleton patterns

- **Hero skeleton** (large banner + 2–3 chips)
- **Card grid skeleton** (venues/catches)
- **Feed list skeleton** (avatar + title + metadata + image)
- **Comments skeleton** (threaded indentation)
- **Sidebar skeleton** (rating summary / venue info)

---

## Page-by-Page Plan

### 1) Landing Page (/) — “Why ReelyRated?”

**Purpose**: sell the loop: _log → learn → follow → compete_.

**Mobile layout**

- **Hero**
  - Headline: “Log your catches. Find venues. Compete with mates.”
  - Subhead: “ReelyRated is the UK freshwater fishing community—track your sessions, share catches, and discover new waters.”
  - CTAs: **Sign up free** / **Explore venues** (secondary)
- **Social proof**
  - 2–3 stacked stats (e.g., catches logged, venues listed, anglers active) _(can be static initially)_
  - 1–2 short testimonials (real later)
- **Feature cards** (4–6)
  - “Log a Catch” (photo, species, weight, venue)
  - “Plan a Session” (date, venue, notes)
  - “Venue intel” (rules, tickets, reviews)
  - “Leaderboards” (monthly challenges)
  - “Follow anglers” (see their sessions & catches)
- **Footer**
  - About / Safety / Contact / Terms / Privacy

**Desktop enhancement**

- Two-column hero with app preview mock.
- Feature grid becomes 2–3 columns.

---

### 2) Feed (Community)

**Purpose**: the heart of the app—fresh catches, comments, reactions.

**Mobile-first**

- Card list with:
  - angler avatar + name + venue + time
  - photo (tap to expand)
  - weight/species chips
  - comment + reaction row with big touch targets
- Empty states that teach:
  - “Follow anglers to see their catches here” + CTA to Explore.

**Desktop enhancement**

- Optional two-column: feed + right rail (leaderboard teaser, trending venues).

---

### 3) Venues (Directory + Venue page)

**Purpose**: discovery + confidence (“Is this water worth a session?”).

**Directory (mobile-first)**

- Search first, then filters (species, ticket type, region, facilities).
- Venue cards show:
  - name + location
  - rating summary
  - key chips: “Day ticket”, “Toilets”, “Cafe”, “Match lake”, “Carp lake”, etc.

**Venue page (mobile-first)**

- Hero: venue name, rating, location chip, “Plan a session” CTA.
- Sections (stacked accordions):
  - **About** (quick summary)
  - **Rules & Tickets** (day tickets, booking links, rules)
  - **Species & Stock** (if known)
  - **Catches from this venue** (filterable)
  - **Tips** (bait/tactics/pegs) _(community content later)_

**Continuity fix (must-do before deeper redesign)**

- Remove nested `min-h-screen` / `h-screen` wrappers inside VenueDetail; rely on the shared Layout shell for full-height layout.
- Ensure only the outlet content swaps on load; navbar and any fixed bars must not visually “cut” the page.
- Add/verify bottom padding (incl. safe-area inset) so fixed nav does not overlap venue CTAs/cards.
- Acceptance: no large blank gap mid-scroll on iPhone viewports; continuous flow from hero → sections → catches.

**Desktop enhancement**

- Side rail: address/map, ticket links, facilities, quick stats.

---

### 4) Catch Detail

**Purpose**: showcase catch + enable conversation.

- Hero photo + metadata (species, weight, venue, session date).
- Rating summary module (when allowed) or “not available” copy (when not allowed).
- Threaded comments: clear indentation, “reply” affordances.
- Report and moderation actions are present but unobtrusive.

---

### 5) Leaderboard

**Purpose**: fun competition; keep it lightweight and motivating.

**Mobile-first**

- Card list with:
  - rank badge, avatar, score
  - dropdown sort (month/species/venues)
- “Your position” card.
- “Climb tips” accordion (short suggestions).

**Desktop enhancement**

- Sortable table with pagination.

---

### 6) Sessions

**Purpose**: planning and personal record.

- List of sessions (date, venue, notes, linked catches).
- “Plan a session” CTA.
- Desktop: optional calendar view later.

---

### 7) Account / Profile

**Purpose**: identity + progress.

**Profile page**

- Avatar, bio, quick stats (catches logged, venues fished, streaks).
- Following strip (your profile only) with search.
- Clear privacy state (public/followers/private).

**Notifications**

- Timeline list with clear category icons (comment, mention, admin warning).
- Swipe/clear actions later.

---

## Venue Owner Services

We keep core data free, but premium features should feel like “tools”, not ads.

### Mobile-first owner experience

- **Events & matches**: quick post (date/time/photo), pin on venue.
- **Offers**: day ticket promos, bait bundles, seasonal updates.
- **Insights**: simple stats cards (views, follows, clicks).
- **Moderation & replies**: respond to comments/reviews; report handling for owners.

### Desktop enhancement

- Bulk editing, richer analytics, downloadable reports.

### Suggested tiers

- **Basic (Free)**: venue page, catches feed, basic info.
- **Premium (Paid)**: events + offers + insights + priority placement.

---

## Implementation Notes (how we build safely)

- Keep v4 UI changes **front-end focused**: componentization, layout, skeletons, copy.
- Don’t block on perfect data; use strong empty states and progressively wire in richer content.
- Each page update should include:
  - mobile layout pass
  - skeleton/empty/error states
  - contrast + tap target check
  - quick performance sanity (image sizes, lazy loads)
- Treat “layout continuity” bugs (e.g., mobile VenueDetail blank-gap) as blockers before broader visual refactors, so our new skeletons and section components don’t amplify existing layout issues.

---
