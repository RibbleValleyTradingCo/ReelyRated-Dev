# React Query Hardening (Phase 2)

## Goals

- Consolidate server-state reads under React Query (consistent caching, staleTime, invalidation).
- Reduce focus flicker and duplicate fetches across Feed/CatchDetail/Profile/Notifications.
- Standardize query keys and cache policy across public and authenticated routes.

## Non-goals

- No schema/RPC changes.
- No UI redesigns (only data-layer refactors when we implement).
- No global behavior changes without explicit per-page opt-in.

## Current status checklist

- [x] VenueDetail core queries migrated
- [x] Feed migrated to React Query
- [x] CatchDetail migrated to React Query
- [x] Profile migrated to React Query
- [x] Notifications surfaces migrated to React Query
- [x] Shared cache policy documented + enforced

## Current defaults (code reality)

- Global React Query defaults live in `src/App.tsx` (staleTime 5m, gcTime 10m, refetchOnWindowFocus false, retry 1).
- VenueDetail overrides key queries to staleTime 60s + retry false.

## References

- 01-PAGE-MIGRATION-PLAN.md
- 02-QUERY-KEYS-AND-CACHE-POLICY.md
- 03-INVALIDATION-MATRIX.md
- 90-TEST-CHECKLIST.md
