-- P1 Step 1: public schema allowlist tightening (local-only)
-- Scope: REVOKE public schema table privileges only; no RLS or function changes.

-- 1) Remove anon writes from all direct-write tables
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.sessions,
  public.catches,
  public.profiles,
  public.notifications,
  public.profile_follows,
  public.catch_reactions
FROM anon;

-- 2) Remove authenticated writes from read-only / RPC-only tables
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.baits,
  public.tags,
  public.water_types,
  public.venues,
  public.venue_owners,
  public.venue_rules,
  public.venue_opening_hours,
  public.venue_pricing_tiers,
  public.venue_species_stock,
  public.profile_blocks,
  public.catch_comments,
  public.leaderboard_scores_detailed
FROM authenticated;

-- 3) Narrow authenticated writes to DELETE-only where client only deletes
REVOKE INSERT, UPDATE ON TABLE
  public.profile_follows,
  public.catch_reactions
FROM authenticated;

REVOKE INSERT ON TABLE
  public.notifications
FROM authenticated;

-- ROLLBACK (inverse grants)
-- GRANT INSERT, UPDATE, DELETE ON TABLE
--   public.sessions,
--   public.catches,
--   public.profiles,
--   public.notifications,
--   public.profile_follows,
--   public.catch_reactions
-- TO anon;
--
-- GRANT INSERT, UPDATE, DELETE ON TABLE
--   public.baits,
--   public.tags,
--   public.water_types,
--   public.venues,
--   public.venue_owners,
--   public.venue_rules,
--   public.venue_opening_hours,
--   public.venue_pricing_tiers,
--   public.venue_species_stock,
--   public.profile_blocks,
--   public.catch_comments,
--   public.leaderboard_scores_detailed
-- TO authenticated;
--
-- GRANT INSERT, UPDATE ON TABLE
--   public.profile_follows,
--   public.catch_reactions
-- TO authenticated;
--
-- GRANT INSERT ON TABLE
--   public.notifications
-- TO authenticated;
