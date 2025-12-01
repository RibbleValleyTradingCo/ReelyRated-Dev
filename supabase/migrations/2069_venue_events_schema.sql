-- 2069_venue_events_schema.sql
-- Schema for venue events / matches / announcements (admin-authored v1).
-- See docs/VENUE-PAGES-DESIGN.md §7 and VENUE-PAGES-ROADMAP.md Phase 3.3.

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.venue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  title text NOT NULL,
  event_type text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  description text,
  ticket_info text,
  website_url text,
  booking_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_events_venue_starts_at ON public.venue_events (venue_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_venue_events_starts_at ON public.venue_events (starts_at);

COMMENT ON TABLE public.venue_events IS 'Venue events/matches/announcements (admin-authored v1). See docs/VENUE-PAGES-DESIGN.md §7.';
COMMENT ON COLUMN public.venue_events.event_type IS 'Free-form type: match, open_day, maintenance, announcement, other (text for now).';
COMMENT ON COLUMN public.venue_events.ticket_info IS 'Free text for entry fee / pegs / payouts.';
COMMENT ON COLUMN public.venue_events.website_url IS 'Optional event-specific website link (HTTPS preferred).';
COMMENT ON COLUMN public.venue_events.booking_url IS 'Optional event-specific booking link (HTTPS preferred).';
COMMENT ON COLUMN public.venue_events.is_published IS 'Published flag. RLS allows public read of published rows; writes are admin RPC only in this phase.';

ALTER TABLE public.venue_events ENABLE ROW LEVEL SECURITY;

-- Public read of published events (anon + authenticated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_events' AND policyname = 'venue_events_select_published'
  ) THEN
    CREATE POLICY venue_events_select_published ON public.venue_events
      FOR SELECT
      USING (is_published = true);
  END IF;
END;
$$;

GRANT SELECT ON public.venue_events TO authenticated, anon;
