# ReelyRated Venue Page Redesign — Master Index

## Product goals
- Consistent visual hierarchy across venue detail sections.
- Mobile-first layouts that feel intentional on small screens.
- Reduce pill usage to only categorical/dynamic labels.
- Make ratings and venue record feel like part of the identity.
- Avoid a stacked-card feel; use whitespace and rhythm instead.

## Non-negotiables
- UI-only changes; no migrations, RPCs, policies, or schema edits.
- No new data fetching; reuse existing in-memory data.
- Section headers follow the shared SectionHeader pattern.
- Banded backgrounds remain subtle and limited (use intentionally).
- If data is missing, use clear fallbacks instead of placeholders like “N/A”.

## Canonical section order (venue detail)
1. Hero (breadcrumbs, name, location, ratings, CTAs)
2. Hero stats strip (Total Catches, Last 30 Days, Venue Record, Top Species)
3. About This Venue + Venue Record (two-column desktop)
4. Venue photo carousel (full-width)
5. Recent Catches
6. Plan Your Visit
7. Booking CTA banner
8. Events & Announcements
9. Top Catches Leaderboard
10. Location / Map

## Current phase status
- Venue detail redesign and premium polish in progress.
- See tracker and changelog for up-to-date progress.

## Deep-dive docs (venue detail)
- Tracker: docs/version4/venue-redesign/01-TRACKER.md
- Scope + guardrails: docs/version4/venue-redesign/02-SCOPE-GUARDRAILS.md
- Open questions: docs/version4/venue-redesign/03-OPEN-QUESTIONS-FOLLOWUPS.md
- UI states: docs/version4/venue-redesign/04-UI-STATES-EMPTY-LOADING-ERROR.md
- Manual test checklist: docs/version4/venue-redesign/05-MANUAL-TEST-CHECKLIST.md
- Changelog: docs/version4/venue-redesign/07-CHANGELOG.md
- Section specs:
  - docs/version4/venue-redesign/10-SECTION-HEADERS.md
  - docs/version4/venue-redesign/20-HERO-RATINGS.md
  - docs/version4/venue-redesign/30-RECORD-CARD.md
  - docs/version4/venue-redesign/40-STATS-ROW.md
  - docs/version4/venue-redesign/50-ABOUT.md
  - docs/version4/venue-redesign/60-PLAN-YOUR-VISIT.md
  - docs/version4/venue-redesign/65-PILL-CLEANUP.md
  - docs/version4/venue-redesign/70-MAP-FULL-WIDTH.md
  - docs/version4/venue-redesign/80-RECENT-CATCHES.md
  - docs/version4/venue-redesign/90-UPCOMING-EVENTS.md

## Venue Owner Admin Panel (new)
- Admin MVP spec: docs/venue-owner-admin/00-ADMIN-MVP-SPEC.md
- Schema MVP: docs/venue-owner-admin/10-SCHEMA-MVP.md
- Admin UI wireframes: docs/venue-owner-admin/20-ADMIN-UI-WIREFRAMES.md
- Public rendering rules: docs/venue-owner-admin/30-PUBLIC-RENDERING.md
- QA checklist: docs/venue-owner-admin/90-TEST-CHECKLIST.md
