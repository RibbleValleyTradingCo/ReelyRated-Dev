# Venues – Owner Tools & Subscription (v4+ Spec)

## 1. Overview

ReelyRated venue pages are **bootstrapped by anglers**: catches, photos, ratings, and comments come from the community first.

The **paid venue owner offering** turns that organic activity into a **business tool** a venue will happily pay for:

- A mini **website** (hero, branding, info).
- A **TripAdvisor-style** review & reply surface.
- A live **catch log** showing real fish caught by real anglers.
- A lightweight **promo & bookings engine** (events/offers/CTAs).
- Simple **analytics** so owners can see value (“this is worth the monthly fee”).

Core principles:

- Anglers can always log catches at a venue **without** an owner in place.
- Owner tools are **additive** (curation, promotion, analytics), not retroactive content control.
- RLS remains the primary guardrail: owners get elevated control for their venue, not global powers.

---

## 2. Personas & Goals

**Primary persona:**  
Venue owner / fishery manager (small business, often non-technical).

They want to:

- Present the venue professionally (“this page looks like our website”).
- Drive **paid visits**: day tickets, sessions, events, syndicate enquiries.
- Manage their **reputation** (reply to reviews/comments).
- Reduce **time spent on the phone** answering the same questions.
- See simple **proof of value** (“ReelyRated sends us anglers”).

**Secondary persona:**

- ReelyRated admin, supporting:
  - Claim flow / ownership verification.
  - Moderation when owner flags content.

---

## 3. Access Model & Subscription

- Anglers:
  - Can log catches to any **public venue**.
  - Can rate, comment, and upload photos as today (subject to RLS/blocking).
- Venue owners:
  - Identified via `venue_owners` (existing table).
  - Gain access to an **“Owner mode”** for their venue when:
    - Ownership has been verified/claimed, and
    - They are on an active subscription plan.
- Admins:
  - Can view all venues and lock/unlock ownership / subscription status.

> **Out of scope for this spec (handled in separate docs):**
>
> - Billing integration (Stripe/etc.).
> - Detailed claim/invite data model (see `VENUES-OWNER-INVITE-*` tests in TEST-PLAN).
> - Pricing strategies.

---

## 4. Owner-Only Capabilities (What They “Get”)

### 4.1 Branding & “Official” Status

**Goals**

- Make the page feel like the **official home** of the venue on ReelyRated.
- First impression is controlled by the owner, not random photos.

**Features**

- **Hero images (official gallery)**

  - Owner can upload and order 1–3 “official” hero images.
  - One image can be marked as the **cover**:
    - Used in the `/venues` card.
    - Used as the main header image on `/venues/:slug`.
  - Community photos still appear below in a “From our anglers” gallery.

- **Tagline & branding**

  - Short tagline (e.g. “Day-ticket carp water with 40lb+ fish and on-site café.”).
  - Optional short strapline for `/venues` cards (1–2 lines).

- **Claimed badge**
  - “Official venue” / “Claimed by owner” badge shown on:
    - Venue detail hero.
    - `/venues` card.
  - Visible to all users; only controllable by admin/owner.

---

### 4.2 Bookings & Contact CTAs

**Goals**

- Turn venue pages into **conversion surfaces**: calls, bookings, enquiries.

**Features**

- **Primary CTAs**

  - Owner-configurable:
    - `website_url`
    - `booking_url`
    - `contact_phone`
    - Optional `contact_email` / `whatsapp_number`.
  - UI:
    - “Book now”, “Visit website”, “Call venue” buttons in hero/meta.
    - On mobile, at least one CTA should be easily tappable (sticky or near top).

- **Click tracking (for Owner)**
  - Log aggregate counts per month:
    - `booking_clicks`
    - `website_clicks`
    - `call_clicks`
  - Surface in owner dashboard (see Analytics).

---

### 4.3 Ticket Types & Pricing Info

**Goals**

- Reduce repetitive calls (“How much is a day ticket?”).
- Make venue cards and detail pages **actionable**.

**Features**

- Owner-controlled ticket/pricing section:

  - Ticket types (e.g. Day, 24hr, Night, Syndicate, Junior, Disabled/accessible pegs).
  - “From £X/day”, “From £Y/24hrs”.
  - Simple availability notes:
    - “No pre-booking – first come first served.”
    - “Night tickets by prior arrangement only.”

- Display:
  - Summary on venue card (e.g. “From £10/day · Day ticket”).
  - Richer breakdown in a “Tickets & prices” section on the detail page.

---

### 4.4 Reviews, Comments & Replies

**Goals**

- Owners can **participate in the conversation** but cannot rewrite history.
- Think TripAdvisor-style management responses.

**Features**

- **Owner replies**

  - Owner can reply to:
    - Venue-level reviews (if added later).
    - Comments on catches tagged at their venue (optional phase).
  - UI emphasises “Reply from [Venue Name]”.

- **Highlight “featured” reviews**

  - Owner can mark 1–3 reviews as “Featured”.
  - These appear in a dedicated block near the top of the page.

- **No direct score editing**
  - Owners cannot change ratings or delete honest (non-abusive) reviews.
  - Abuse/ToS violations go through the moderation flow (see Moderation section).

---

### 4.5 Catches & Photo Curation

**Goals**

- Use angler content as **authentic marketing**.
- Let owners highlight best fish & experiences without silencing community.

**Features**

- **Featured catches**

  - Owner can “pin” selected catches as **Featured** for their venue.
    - E.g. lake records, junior match winners, special captures.
  - Featured catches appear in a prominent strip (e.g. “Venue highlights”).

- **Official photo gallery**

  - Owner-managed gallery for:
    - Facilities, peg views, stocking days, maps.
  - Distinct from “From our anglers” gallery.

- **Soft de-emphasis of unwanted images**
  - Owner can mark community photos as “Low priority”:
    - They move further down the gallery or into a “More photos” section.
    - They are **not deleted** and still belong to the angler.

---

### 4.6 Events & Offers

**Goals**

- Help venues **fill swims and events**, especially in quieter periods.
- Give owners a reason to come back regularly to edit their page.

**Features**

- **Events**

  - Owner can create events:
    - Matches, open days, tuition sessions, charity events, juniors/ladies days.
  - Fields:
    - Title, description, date/time, venue water (if multiple), price, booking link.
  - Display:
    - “Upcoming events” block on the venue page.
    - Optionally surfaced in a global “What’s on” area of the app.

- **Offers & promotions**
  - Owner can add short-lived offers:
    - “Midweek 2-for-1 day tickets.”
    - “Kids fish free with paying adult (August).”
  - Optional promo code field.
  - Displayed in an “Offers” panel on the venue page.

---

### 4.7 Practical Info & FAQs

**Goals**

- Reduce friction on arrival and reduce support overhead.

**Features**

- **Key info block**

  - Opening times.
  - Rules summary.
  - Facilities (toilets, café, parking, disabled access, showers, shop, etc.).
  - Stocking/species overview:
    - Species list + typical/top weights.

- **FAQs**
  - Simple Q&A list:
    - “Do you allow dogs?”
    - “Are barbed hooks allowed?”
    - “Can I bring non-fishing guests?”
  - Owner-editable text, surfaced under a “Before you visit” section.

---

### 4.8 Insights & Analytics

**Goals**

- Provide a clear argument for the subscription: **“Look what you’re getting.”**

**Features**

- **Owner dashboard (per venue)**

  - Time range (e.g. last 30 days, last 90 days).
  - Metrics:
    - Page views.
    - Booking/website/call CTA clicks.
    - Number of catches logged to this venue.
    - Unique anglers who logged catches.
  - Optional breakdown:
    - Species mix (% of carp vs others).
    - Seasonal trends (when most catches happen).

- **Simple messaging**
  - Copy should help owners understand impact:
    - “ReelyRated sent X booking clicks to your website in the last 30 days.”

---

### 4.9 Moderation & Safeguarding

**Goals**

- Protect the venue’s brand and anglers’ experience.
- Keep trust by not letting owners silently erase valid criticism.

**Features**

- **Flag content for review**

  - Owners can flag:
    - Photos/catches that show unsafe handling or break venue rules.
    - Comments/reviews that are abusive or clearly off-topic.
  - Flags feed into an internal moderation queue for ReelyRated admins.

- **Request removal, not delete**

  - Owner cannot directly delete user-generated content.
  - Admin reviews the request and decides:
    - Remove content, or
    - Keep content but possibly add a moderation note.

- **Visibility adjustments (future)**
  - Option to lightly de-prioritise certain content (e.g. very old, pre-refurb) without full removal.

---

## 5. Claim & Onboarding Flow (High-Level)

> Detailed invite/claim flow is covered by `VENUES-OWNER-INVITE-*` cases in TEST-PLAN and a future dedicated spec. This section explains how it should feel for the owner.

1. **Organic baseline**

   - Venue page already has:
     - Catches.
     - Photos.
     - Ratings and comments.
   - Owners may discover it via:
     - Angler sharing a link.
     - ReelyRated outbound email.

2. **“Claim this venue” entry point**

   - Banner on venue detail for non-owner signed-in users:
     - “Do you manage this venue? Claim this page to add your info, promote events, and see stats.”
   - Clicking opens the claim/invite flow.

3. **Verification**

   - Owner proves they manage the venue (e.g. business email, simple manual checks).
   - Once approved, their user id is added to `venue_owners`.

4. **Subscription**

   - They pick a subscription plan.
   - On success, venue switches to **Owner mode** for them.

5. **Immediate payoff**
   - After the first login as owner, they’re guided to:
     - Add hero images and tagline.
     - Add booking/contact info.
     - Highlight a few featured catches.
     - Add at least one event/offer.

---

## 6. Technical Hooks & Constraints (Implementation Notes)

- Re-use existing tables where possible:
  - `venues`, `venue_owners`, `catches`, `notifications`, `venue_events` (if/when created).
- Add new fields incrementally (e.g. tagline, FAQ, promo fields) via migrations, keeping v3 behaviour unchanged for non-owner views.
- Owner-only controls should be enforced via:
  - UI (only owners/admin see owner console).
  - RLS (write policies limited to `venue_owners.user_id` or admins).
- All owner features must **degrade gracefully** if:
  - Subscription lapses → owner badge and tools may be disabled, but venue page remains visible with existing angler content.

---

## 7. Out of Scope for Initial v4 Cut

To keep the first v4 release shippable, the following can be treated as **later phases**:

- Full-blown billing flows and self-serve plan upgrades/downgrades.
- Advanced analytics (e.g. peg-by-peg stats, conversion funnels).
- Complex moderation workflows with multi-step appeal processes.
- Cross-venue dashboards for owners with multiple venues (can be separate spec).
- Deep schema changes to ticket types (move to enums/lookup tables) – tracked separately in `VENUES-002` follow-up notes in TEST-PLAN.
