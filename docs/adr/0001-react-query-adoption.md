# ADR 0001: React Query Adoption for Server State

## Context
The app currently mixes manual Supabase fetches, local state caches, and ad-hoc invalidation. This causes focus flicker, duplicate requests, and inconsistent cache behavior across routes (Feed, CatchDetail, Profile, Notifications, VenueDetail).

## Decision
Adopt TanStack React Query as the standard for server state:
- All server reads use useQuery/useInfiniteQuery.
- Mutations invalidate or update queries via queryClient.
- Cache policy is consistent and documented (staleTime, gcTime, refetchOnWindowFocus).

## Consequences
- Reduced refetch/flicker and simpler async state handling.
- A single source of truth for cache keys and invalidation.
- Requires migration work per page (documented in Phase 2 plan).

## Guardrails
- No schema/RPC changes as part of React Query migration.
- UI state remains local; only server state is cached.
- Avoid ad-hoc caches outside React Query (avoid parallel cache layers).
  - Exception (current): `src/lib/venueCache.ts` is used by VenueDetail and should be removed once page migrations are complete.
