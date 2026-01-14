> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# Persona Permission Contract (DB / Data API)

## Purpose
Define the intended permission model for ReelyRatedv3 personas so we can verify grants/RLS/RPC exposure against a single source of truth. This contract is referenced by every surface PIPELINE.

## Personas (intent)
- anon: read-only on public-safe objects; no writes; no internal tables.
- authenticated: can read/write only their own rows per surface; can't touch internal tables.
- owner: same as authenticated + owner-only domain objects (venues they own, etc.).
- admin: admin-only RPCs and admin surfaces; avoid broad table rights unless necessary.

## Non-negotiables
1) Deny by default: if access is not proven necessary, it should not remain granted.
2) Public/exposed schemas must use RLS for Data API access; RLS is required on tables in exposed schemas (commonly `public`).
3) Internal tables (e.g., rate limits, moderation/audit internals) must not be directly writable by client roles.
4) Prefer SECURITY INVOKER by default.
5) If SECURITY DEFINER is required, pin function search_path (prefer `search_path = ''`) and schema-qualify all references (treat mutable search_path as a lint finding).

## What "public-safe" vs "internal" means (DB terms)
- Public-safe objects:
  - Data intended for unauthenticated viewing OR broadly readable with RLS constraints.
  - Reads should be via RLS-protected base tables, public-safe views, or read-only RPCs.
- Internal objects:
  - Anything that exists primarily to enforce security, prevent abuse, or store privileged operational data (e.g., rate_limits, moderation logs, internal notes, admin-only artifacts).
  - Internal objects should be accessed only via privileged boundaries (admin RPCs, SECURITY DEFINER helpers, server-side code), not direct client table writes.

## Role mapping notes (Supabase)
- anon/authenticated are client roles; service_role is server-only.
- "owner" and "admin" are application personas enforced via RLS policies and/or gated RPCs.

## Evidence expectations
- Global posture is proven by the Global Persona Probe Pack (see `docs/version5/hardening/_global/legacy/GLOBAL-DB-LOCKDOWN-PLAN.md`).
- Surface posture is proven inside each surface PIPELINE evidence checklist (HAR + focused SQL probes + minimal grant diffs).

## References (for rationale)
- Supabase: RLS required on tables in exposed schemas; hardening the Data API; private schema recommendation for non-exposed tables.
- Supabase: pin SECURITY DEFINER function search_path (prefer empty) to avoid search_path attacks.
