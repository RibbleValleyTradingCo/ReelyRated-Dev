-- 2128_add_venue_detail_indexes.sql
-- Add composite indexes to support venue detail hot-path reads.

SET search_path = public, extensions;

-- Venue photos: filter by venue_id, order by is_primary desc, created_at desc.
CREATE INDEX IF NOT EXISTS idx_venue_photos_venue_primary_created
  ON public.venue_photos (venue_id, is_primary DESC, created_at DESC);

-- Venue species stock: filter by venue_id, order by created_at asc.
CREATE INDEX IF NOT EXISTS idx_venue_species_stock_venue_created
  ON public.venue_species_stock (venue_id, created_at);

-- Opening hours: filter by venue_id, order by order_index asc.
CREATE INDEX IF NOT EXISTS idx_venue_opening_hours_venue_order
  ON public.venue_opening_hours (venue_id, order_index);

-- Pricing tiers: filter by venue_id, order by order_index asc.
CREATE INDEX IF NOT EXISTS idx_venue_pricing_tiers_venue_order
  ON public.venue_pricing_tiers (venue_id, order_index);
