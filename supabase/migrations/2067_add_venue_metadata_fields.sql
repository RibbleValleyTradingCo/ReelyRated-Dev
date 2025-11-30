-- 2067_add_venue_metadata_fields.sql
-- Add venue metadata fields and a read-only venue_stats view for Phase 3.1.

SET search_path = public, extensions;

-- Metadata fields on public.venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS short_tagline text,
  ADD COLUMN IF NOT EXISTS ticket_type text,
  ADD COLUMN IF NOT EXISTS price_from text,
  ADD COLUMN IF NOT EXISTS best_for_tags text[],
  ADD COLUMN IF NOT EXISTS facilities text[],
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS notes_for_rr_team text;

COMMENT ON COLUMN public.venues.short_tagline IS 'Short venue tagline for cards/heroes (e.g. “Big carp day-ticket venue with 3 main lakes”).';
COMMENT ON COLUMN public.venues.ticket_type IS 'Ticket/membership type label (e.g. Day ticket, Syndicate, Club water, Coaching venue).';
COMMENT ON COLUMN public.venues.price_from IS 'Starting price text, e.g. “from £10 / day”.';
COMMENT ON COLUMN public.venues.best_for_tags IS 'Array of tags describing who/what the venue is best for (e.g. Carp, Match, Families).';
COMMENT ON COLUMN public.venues.facilities IS 'Array of facilities available (e.g. Toilets, Café, Tackle shop, Parking, Accessible pegs).';
COMMENT ON COLUMN public.venues.website_url IS 'Venue website URL (HTTPS preferred).';
COMMENT ON COLUMN public.venues.booking_url IS 'Venue booking URL (outbound only, HTTPS required in app validation).';
COMMENT ON COLUMN public.venues.contact_phone IS 'Optional contact phone number for the venue.';
COMMENT ON COLUMN public.venues.notes_for_rr_team IS 'Admin-only notes for ReelyRated staff; not surfaced to end users.';

-- Read-only venue stats view for cards/heroes (aggregated, no per-catch detail).
DROP VIEW IF EXISTS public.venue_stats;

CREATE VIEW public.venue_stats AS
WITH base AS (
  SELECT
    c.venue_id,
    COUNT(*)::int AS total_catches,
    COUNT(*) FILTER (WHERE c.created_at >= (now() - INTERVAL '30 days'))::int AS recent_catches_30d,
    MAX(c.weight) FILTER (WHERE c.weight IS NOT NULL) AS headline_pb_weight,
    (
      SELECT c2.weight_unit
      FROM public.catches c2
      WHERE c2.venue_id = c.venue_id
        AND c2.deleted_at IS NULL
        AND c2.weight IS NOT NULL
      ORDER BY c2.weight DESC NULLS LAST, c2.created_at DESC
      LIMIT 1
    ) AS headline_pb_unit,
    (
      SELECT c3.species
      FROM public.catches c3
      WHERE c3.venue_id = c.venue_id
        AND c3.deleted_at IS NULL
        AND c3.weight IS NOT NULL
      ORDER BY c3.weight DESC NULLS LAST, c3.created_at DESC
      LIMIT 1
    ) AS headline_pb_species
  FROM public.catches c
  WHERE c.venue_id IS NOT NULL
    AND c.deleted_at IS NULL
  GROUP BY c.venue_id
),
species AS (
  SELECT
    c.venue_id,
    ARRAY(
      SELECT s.species
      FROM (
        SELECT c2.species, COUNT(*) AS species_count
        FROM public.catches c2
        WHERE c2.venue_id = c.venue_id
          AND c2.deleted_at IS NULL
          AND c2.venue_id IS NOT NULL
          AND c2.species IS NOT NULL
        GROUP BY c2.species
        ORDER BY species_count DESC, c2.species
        LIMIT 3
      ) s
    ) AS top_species
  FROM public.catches c
  WHERE c.venue_id IS NOT NULL
    AND c.deleted_at IS NULL
  GROUP BY c.venue_id
)
SELECT
  b.venue_id,
  b.total_catches,
  b.recent_catches_30d,
  b.headline_pb_weight,
  b.headline_pb_unit,
  b.headline_pb_species,
  COALESCE(s.top_species, ARRAY[]::text[]) AS top_species
FROM base b
LEFT JOIN species s ON s.venue_id = b.venue_id;

COMMENT ON VIEW public.venue_stats IS 'Aggregated venue metrics for cards/heroes (counts, recent activity, PB, top species). Aggregates visible catches with venue_id; per-catch privacy is not exposed here.';

GRANT SELECT ON public.venue_stats TO authenticated, anon;
