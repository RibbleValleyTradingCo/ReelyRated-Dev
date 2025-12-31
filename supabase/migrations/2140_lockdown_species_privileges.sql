SET search_path = public, extensions;

ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.species FROM anon, authenticated;
GRANT SELECT ON TABLE public.species TO anon, authenticated;
