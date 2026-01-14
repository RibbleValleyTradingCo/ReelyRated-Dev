# Account Deleted Pipeline (E2E)
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | TODO | (link to section below) | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | TODO | | |
| Anti-enumeration UX verified | TODO | | |
| RLS/policies verified for surface tables | TODO | | |
| Grants verified (least privilege) | TODO | | |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | TODO | | |
| Manual UX pass (4 personas) | TODO | HAR + screenshots | |
| SQL probe evidence captured | TODO | CSV/SQL outputs | |
| Result | TODO | | PASS / FAIL |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope
- Route: UNKNOWN (confirm in `src/App.tsx`).
- Page: UNKNOWN (confirm page component).
- Auth gate: UNKNOWN (RequireAuth/useAuth/etc).
- Admin gate: UNKNOWN (if applicable).
- Related surfaces: UNKNOWN (if applicable).

## Surface narrative (step-by-step)
1) Route + access gate
   - UNKNOWN.
2) Initial load
   - UNKNOWN.
3) User actions / flows
   - UNKNOWN.
4) Error/deny UX
   - UNKNOWN.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

### Storage
- UNKNOWN.

### Realtime
- UNKNOWN.

### Third-party APIs
- UNKNOWN.

## Implicit DB side-effects
- UNKNOWN.

## Security posture notes (facts only)
- UNKNOWN (scaffold only; verify in code and migrations).

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (<TABLES>);

-- RLS policies for touched tables/views
select *
from pg_policies
where schemaname = 'public'
  and tablename in (<TABLES>);

-- RPC posture (if any)
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (<RPCS>);

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (<RPCS>);

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in (<RPCS>);
```

## Repro commands used
```
# None yet (scaffold only). Suggested commands:
rg -n "<Route|createBrowserRouter|path=" src -S
rg -n "<SURFACE_KEYWORDS>" src -S
rg -n "supabase\.rpc\(|supabase\.from\(|storage\.from\(|channel\(|realtime|postgres_changes" src -S
rg -n "<TABLE_OR_RPC_KEYWORDS>" supabase/migrations -S
```
