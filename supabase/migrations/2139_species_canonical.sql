SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.species (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'species_select_all'
      AND schemaname = 'public'
      AND tablename = 'species'
  ) THEN
    CREATE POLICY species_select_all ON public.species
      FOR SELECT USING (true);
  END IF;
END;
$policies$;

GRANT SELECT ON public.species TO anon, authenticated;

INSERT INTO public.species (slug, label, sort_order, active)
VALUES
  ('arctic_char', 'Arctic Char', 1, true),
  ('atlantic_salmon', 'Atlantic Salmon', 2, true),
  ('barbel', 'Barbel', 3, true),
  ('bleak', 'Bleak', 4, true),
  ('bream', 'Bream (Unspecified)', 5, true),
  ('common_bream', 'Common Bream', 6, true),
  ('silver_bream', 'Silver Bream', 7, true),
  ('brown_trout', 'Brown Trout', 8, true),
  ('trout', 'Trout (Unspecified)', 9, true),
  ('bullhead', 'Bullhead', 10, true),
  ('carp', 'Carp (Unspecified)', 11, true),
  ('common_carp', 'Common Carp', 12, true),
  ('mirror_carp', 'Mirror Carp', 13, true),
  ('leather_carp', 'Leather Carp', 14, true),
  ('ghost_carp', 'Ghost Carp', 15, true),
  ('grass_carp', 'Grass Carp', 16, true),
  ('crucian_carp', 'Crucian Carp', 17, true),
  ('wels_catfish', 'Wels Catfish', 18, true),
  ('catfish', 'Catfish (Unspecified)', 19, true),
  ('chub', 'Chub', 20, true),
  ('dace', 'Dace', 21, true),
  ('european_eel', 'European Eel', 22, true),
  ('ferox_trout', 'Ferox Trout', 23, true),
  ('golden_orfe', 'Golden Orfe', 24, true),
  ('grayling', 'Grayling', 25, true),
  ('gudgeon', 'Gudgeon', 26, true),
  ('ide', 'Ide', 27, true),
  ('lamprey', 'Lamprey', 28, true),
  ('perch', 'Perch', 29, true),
  ('pike', 'Pike', 30, true),
  ('powan', 'Powan', 31, true),
  ('rainbow_trout', 'Rainbow Trout', 32, true),
  ('roach', 'Roach', 33, true),
  ('rudd', 'Rudd', 34, true),
  ('sea_trout', 'Sea Trout', 35, true),
  ('smelt', 'Smelt', 36, true),
  ('stickleback', 'Stickleback', 37, true),
  ('stone_loach', 'Stone Loach', 38, true),
  ('sturgeon', 'Sturgeon', 39, true),
  ('tench', 'Tench', 40, true),
  ('zander', 'Zander', 41, true),
  ('other', 'Other', 42, true)
ON CONFLICT (slug) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

CREATE OR REPLACE FUNCTION public.get_species_options(
  p_only_active boolean DEFAULT true,
  p_only_with_catches boolean DEFAULT false
)
RETURNS TABLE (
  slug text,
  label text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT s.slug, s.label
  FROM public.species s
  WHERE (NOT p_only_active OR s.active)
    AND (
      NOT p_only_with_catches
      OR EXISTS (
        SELECT 1
        FROM public.leaderboard_scores_detailed l
        WHERE l.species_slug = s.slug
      )
    )
  ORDER BY s.sort_order, s.label;
$$;

REVOKE EXECUTE ON FUNCTION public.get_species_options(boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_species_options(boolean, boolean) TO anon, authenticated;
