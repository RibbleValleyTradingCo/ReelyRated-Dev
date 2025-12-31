# Venue Feed vs Venue Detail Mapping

This document lists user-visible data elements and their sources as implemented in the current codebase.

## /venues (feed cards)

Primary render path: `src/pages/VenuesIndex.tsx` (cards are rendered inline; `VenueThumbnail` is defined in the same file).

Data sources:
- `get_venues` RPC (venue list fields used throughout the card).
- Per-venue thumbnail fetches: `get_venue_photos` (primary) and `get_venue_recent_catches` (fallback).

Elements (card only):
- Card image — Source: `get_venue_photos` -> `image_path` (converted via `getPublicAssetUrl`) or fallback `get_venue_recent_catches` -> `image_url` (and `title` for alt text); venue name used for alt — Render: `VenueThumbnail` in `src/pages/VenuesIndex.tsx`.
- Ticket type chip — Source: `get_venues` -> `ticket_type` (trimmed) — Render: `VenueThumbnail` in `src/pages/VenuesIndex.tsx`.
- Venue name — Source: `get_venues` -> `name` — Render: card header in `src/pages/VenuesIndex.tsx`.
- Location line — Source: `get_venues` -> `location` (fallback to a static string if null) — Render: card header in `src/pages/VenuesIndex.tsx`.
- Average rating + rating count — Source: `get_venues` -> `avg_rating`, `rating_count` (shown only when `rating_count > 0`) — Render: card header in `src/pages/VenuesIndex.tsx`.
- Tagline — Source: `get_venues` -> `short_tagline` (fallback to static string if empty) — Render: card header in `src/pages/VenuesIndex.tsx`.
- Catches logged — Source: `get_venues` -> `total_catches` — Render: “Catches logged” stat in `src/pages/VenuesIndex.tsx`.
- Last 30 days count + hot indicator — Source: `get_venues` -> `recent_catches_30d` (flame icon shown when count >= 5) — Render: “Last 30 days” stat in `src/pages/VenuesIndex.tsx`.
- Facilities chips — Source: `get_venues` -> `facilities` (deduped + truncated) — Render: chip list in `src/pages/VenuesIndex.tsx`.
- Price line — Source: `get_venues` -> `price_from` (formatted with `getDisplayPriceFrom`) — Render: footer line in `src/pages/VenuesIndex.tsx`.
- “View venue” link — Source: `get_venues` -> `slug` — Render: footer button in `src/pages/VenuesIndex.tsx`.
- Note: feed tags now come from `facilities`; `best_for_tags` is deprecated in-app (pending DB contract cleanup).

## /venues/:slug (venue detail)

Primary render path: `src/pages/VenueDetail.tsx` (builds the view model and passes data into sections).

Data sources (from `src/pages/venue-detail/hooks/useVenueDetailData.ts`):
- `get_venue_by_slug` -> `Venue` (see `src/pages/venue-detail/types.ts`).
- `get_venue_photos` -> `VenuePhoto`.
- `get_venue_recent_catches` -> `CatchRow`.
- `get_venue_top_catches` -> `CatchRow`.
- `get_venue_upcoming_events` / `get_venue_past_events` -> `VenueEvent`.
- Tables: `venue_opening_hours`, `venue_pricing_tiers`, `venue_species_stock`, `venue_rules`.
- `get_my_venue_rating` (user’s rating); `upsert_venue_rating` (submit).

View model: `src/pages/venue-detail/viewModel.ts` (derives display-ready fields like `heroTagline`, `displayPriceFrom`, `ratingSummaryText`, `heroImages`, `mapsUrl`).

### VenueHero (`src/pages/venue-detail/components/VenueHero.tsx`)
- Breadcrumb + H1 name — Source: `get_venue_by_slug` -> `Venue.name` — Render: `VenueHero`.
- Unpublished chip — Source: `Venue.is_published` + `isOwner`/`isAdmin` (owner/admin detection in `useVenueDetailData`) — Render: `VenueHero`.
- Location line — Source: `Venue.location` — Render: `VenueHero`.
- Hero tagline — Source: `viewModel.heroTagline` (computed from `Venue.short_tagline` or `Venue.description`) — Render: `VenueHero`.
- Rating summary text — Source: `viewModel.ratingSummaryText` (derived from `Venue.avg_rating`, `Venue.rating_count`, and rating state) — Render: `VenueHero`.
- User rating line (e.g., “You rated this X stars”) — Source: `get_my_venue_rating` -> `userRating` — Render: `VenueHero`.
- Book Now CTA — Source: `viewModel.primaryCtaUrl` (from `Venue.booking_url` or `Venue.website_url`) + `Venue.booking_enabled` (controls enabled/disabled state and “Bookings currently closed” copy) — Render: `VenueHero`.
- Call Venue CTA — Source: `viewModel.contactPhone` (from `Venue.contact_phone`) — Render: `VenueHero`.
- Secondary CTA label + URL — Source: `viewModel.secondaryCtaLabel`/`secondaryCtaUrl` (derived from `Venue.website_url` and `Venue.price_from`) — Render: `VenueHero`.
- Get Directions CTA — Source: `viewModel.mapsUrl` (computed from `Venue.name`) — Render: `VenueHero`.
- Manage/Edit Venue CTA — Source: `Venue.slug` + `isOwner`/`isAdmin` — Render: `VenueHero`.
- Hero background + carousel — Source: `viewModel.heroImages` / `activeHeroImage` (from `get_venue_photos` -> `VenuePhoto.image_path`, fallback to `CatchRow.image_url`) — Render: `VenueHero`.

### HeroStatsStrip (`src/pages/venue-detail/components/HeroStatsStrip.tsx`)
- Total Catches — Source: `viewModel.totalCatches` (from `Venue.total_catches`) — Render: `HeroStatsStrip`.
- Last 30 Days — Source: `viewModel.recentWindow` (from `Venue.recent_catches_30d`) — Render: `HeroStatsStrip`.
- Venue Record — Source: `viewModel.statsRecordWeightLabel` (from `Venue.headline_pb_weight` + `Venue.headline_pb_unit`) — Render: `HeroStatsStrip`.
- Top Species — Source: `viewModel.topSpeciesLabel` (from `Venue.top_species[0]`, humanized) — Render: `HeroStatsStrip`.

### AboutSection + VenueRecordCard (`src/pages/venue-detail/components/AboutSection.tsx`, `src/pages/venue-detail/components/VenueRecordCard.tsx`)
- About text — Source: `viewModel.aboutText` (from `Venue.description` or `heroTagline`) — Render: `AboutSection`.
- “Add more info” admin hint — Source: `viewModel.showAboutAdminHint` (depends on `Venue.description`/`heroTagline` and owner/admin) — Render: `AboutSection`.
- Record weight label — Source: `viewModel.recordWeightLabel` (from top catch weight or `Venue.headline_pb_weight` + unit) — Render: `VenueRecordCard`.
- Record species label — Source: `viewModel.recordSpeciesLabel` (from top catch species or `Venue.headline_pb_species`) — Render: `VenueRecordCard`.
- Featured catch image + link — Source: `get_venue_top_catches` -> `CatchRow.image_url`, `CatchRow.id` — Render: `VenueRecordCard`.
- Angler name + avatar fallback — Source: `CatchRow.profiles.username` — Render: `VenueRecordCard`.
- Catch date — Source: `CatchRow.created_at` — Render: `VenueRecordCard`.
- Lake name — Source: `CatchRow.location` — Render: `VenueRecordCard`.
- Ratings/comments/reactions counts — Source: `CatchRow.ratings`, `CatchRow.comments`, `CatchRow.reactions` — Render: `VenueRecordCard`.

### VenueCarouselSection (`src/pages/venue-detail/components/VenueCarouselSection.tsx`)
- Carousel images — Source: `viewModel.carouselItems` (from `VenuePhoto.image_path` or fallback `CatchRow.image_url`; alt from `Venue.name` or catch title) — Render: `VenueCarouselSection`.
- Carousel label — Source: `viewModel.carouselLabel` (constant "Venue photo gallery") — Render: `VenueCarouselSection`.

### RecentCatchesSection (`src/pages/venue-detail/components/RecentCatchesSection.tsx`)
- Section subtitle venue name — Source: `Venue.name` — Render: `RecentCatchesSection`.
- Catch card image — Source: `CatchRow.image_url` — Render: `RecentCatchesSection`.
- Catch title (alt text) — Source: `CatchRow.title` (sanitized) — Render: `RecentCatchesSection`.
- Angler name + avatar — Source: `CatchRow.profiles.username`, `profiles.avatar_path`/`profiles.avatar_url` — Render: `RecentCatchesSection`.
- Catch date — Source: `CatchRow.created_at` — Render: `RecentCatchesSection`.
- Catch weight + unit — Source: `CatchRow.weight`, `CatchRow.weight_unit` — Render: `RecentCatchesSection`.
- Species label — Source: `CatchRow.species` (humanized) — Render: `RecentCatchesSection`.
- View-all count + link — Source: `viewModel.viewAllCount` (from `Venue.total_catches`) and `Venue.slug` — Render: `RecentCatchesSection`.

### PlanYourVisitSection (`src/pages/venue-detail/components/PlanYourVisitSection.tsx`)
- Ticket / pricing headline — Source: `viewModel.displayPriceFrom` (from `Venue.price_from`) and `viewModel.ticketType` (from `Venue.ticket_type`) — Render: “Tickets” block in `PlanYourVisitSection`.
- Pricing tiers list — Source: `venue_pricing_tiers` -> `label`, `price`, `unit`, `audience`, `order_index` — Render: “Tickets” block in `PlanYourVisitSection`.
- Payment methods + notes — Source: `Venue.payment_methods`, `Venue.payment_notes` — Render: “Payment” block in `PlanYourVisitSection`.
- Booking method + phone link — Source: `viewModel.contactPhone` (from `Venue.contact_phone`) — Render: “How to Book / Contact” in `PlanYourVisitSection`.
- Booking/website links — Source: `viewModel.bookingUrl` / `viewModel.websiteUrl` (from `Venue.booking_url`, `Venue.website_url`) — Render: “How to Book / Contact” and sidebar CTA in `PlanYourVisitSection`.
- Booking enabled status — Source: `Venue.booking_enabled` — Render: “Bookings currently closed” copy and disabled links in `PlanYourVisitSection` — Edit: Booking toggle in the “Contact & Handoff” accordion via `BookingCard` (`src/pages/venue-owner-admin/components/BookingCard.tsx`) on `src/pages/MyVenueEdit.tsx` (manager) and `src/pages/AdminVenueEdit.tsx` (admin).
- Opening hours — Source: `venue_opening_hours` -> `label`, `day_of_week`, `opens_at`, `closes_at`, `is_closed`, `order_index` — Render: “Opening times” in `PlanYourVisitSection`.
- Stock & species — Source: `venue_species_stock` -> `species_name`, `record_weight`, `record_unit`, `avg_weight`, `size_range_min`, `size_range_max`, `stock_density`, `stock_notes` — Render: “Stock & Species” in `PlanYourVisitSection`.
- Facilities list — Source: `viewModel.facilitiesList` (from `Venue.facilities`, filtered) — Render: “Facilities & Comfort” in `PlanYourVisitSection`.
- Rules list — Source: `venue_rules.rules_text` (split into list items) — Render: “Venue Rules” in `PlanYourVisitSection`.
- Booking banner (“Ready to land your next PB?”) — Source: `viewModel.activeAnglers` (from `Venue.active_anglers_all_time`), `viewModel.displayPriceFrom` (from `Venue.price_from`), `viewModel.ticketType` (from `Venue.ticket_type`), `viewModel.recentWindow` (from `Venue.recent_catches_30d`), booking/website/maps URLs — Render: booking banner in `PlanYourVisitSection`.

### EventsSection (`src/pages/venue-detail/components/EventsSection.tsx`)
- Event title — Source: `VenueEvent.title` from `get_venue_upcoming_events` / `get_venue_past_events` — Render: `EventsSection`.
- Event date range — Source: `VenueEvent.starts_at`, `VenueEvent.ends_at` — Render: `EventsSection`.
- Event type pill — Source: `VenueEvent.event_type` — Render: `EventsSection`.
- Description — Source: `VenueEvent.description` — Render: `EventsSection`.
- Ticket info — Source: `VenueEvent.ticket_info` — Render: `EventsSection`.
- Booking / website link — Source: `VenueEvent.booking_url` or `VenueEvent.website_url` (normalized) — Render: `EventsSection`.

### LeaderboardSection (`src/pages/venue-detail/components/LeaderboardSection.tsx`)
- Catch image — Source: `CatchRow.image_url` from `get_venue_top_catches` — Render: `LeaderboardSection`.
- Catch title — Source: `CatchRow.title` (sanitized) — Render: `LeaderboardSection`.
- Weight — Source: `CatchRow.weight`, `CatchRow.weight_unit` — Render: `LeaderboardSection`.
- Species — Source: `CatchRow.species` — Render: `LeaderboardSection`.
- Date — Source: `CatchRow.created_at` — Render: `LeaderboardSection`.
- Owner/angler — Source: `CatchRow.profiles.username` (fallback to `CatchRow.user_id`) — Render: `LeaderboardSection`.
- “Be the first to log a catch” link — Source: `Venue.slug` — Render: `LeaderboardSection`.

### LocationMapSection (`src/pages/venue-detail/components/LocationMapSection.tsx`)
- Map iframe URL — Source: `viewModel.mapEmbedUrl` (computed from `Venue.name` + `Venue.location`) — Render: `LocationMapSection`.
- Address line — Source: `Venue.location` — Render: `LocationMapSection`.
- Get Directions link — Source: `viewModel.mapsUrl` (computed from `Venue.name`) — Render: `LocationMapSection`.
- Call Venue button — Source: `viewModel.contactPhone` (from `Venue.contact_phone`) — Render: `LocationMapSection`.

### RatingModal (`src/pages/venue-detail/components/RatingModal.tsx`)
- Rating summary line — Source: `viewModel.ratingSummaryText` (from `Venue.avg_rating`, `Venue.rating_count`, and rating state) — Render: `RatingModal`.
- Venue name (aria label) — Source: `Venue.name` — Render: `RatingModal`.

### Sticky CTA bar (`src/pages/VenueDetail.tsx`)
- “Log catch” link — Source: `Venue.slug` — Render: sticky CTA in `VenueDetail.tsx`.
- “Maps” link — Source: `viewModel.mapsUrl` (computed from `Venue.name`) — Render: sticky CTA in `VenueDetail.tsx`.
