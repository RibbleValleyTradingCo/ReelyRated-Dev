SET search_path = public, extensions;

REVOKE ALL ON TABLE public.community_stats_live FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_stats_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_stats_waterways FROM anon, authenticated;

ALTER TABLE public.community_stats_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stats_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stats_waterways ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.community_stats_live FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_stats_users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_stats_waterways FORCE ROW LEVEL SECURITY;
