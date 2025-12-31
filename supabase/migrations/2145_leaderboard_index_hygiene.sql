SET search_path = public, extensions;

CREATE INDEX IF NOT EXISTS idx_ratings_catch_id
ON public.ratings (catch_id);

CREATE INDEX IF NOT EXISTS idx_catches_species_coalesce
ON public.catches ((COALESCE(species_slug, species)));

CREATE INDEX IF NOT EXISTS idx_catches_public_visible_created_id
ON public.catches (created_at, id)
WHERE visibility = 'public' AND deleted_at IS NULL;
