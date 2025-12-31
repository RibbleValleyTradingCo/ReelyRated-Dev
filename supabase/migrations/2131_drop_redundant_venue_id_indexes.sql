-- 2131_drop_redundant_venue_id_indexes.sql
-- Drop redundant single-column venue_id indexes superseded by composite hot-path indexes.

SET search_path = public, extensions;

DROP INDEX IF EXISTS public.idx_venue_opening_hours_venue_id;
DROP INDEX IF EXISTS public.idx_venue_pricing_tiers_venue_id;
DROP INDEX IF EXISTS public.idx_venue_species_stock_venue_id;
