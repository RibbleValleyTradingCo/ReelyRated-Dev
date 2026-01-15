> ⚠️ LEGACY (archived 2026-01-13)
> This file is the v1 global hardening attempt preserved for audit/history.
> Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
> Do not update posture here unless you are explicitly updating legacy history notes.

# Personas

## Persona matrix

| Persona  | Email                    | UID                                  |
| -------- | ------------------------ | ------------------------------------ |
| Admin    | admin@reelyrated.test    | 1a04a24c-0307-4364-9967-7cc043bfbfbc |
| Owner    | owner@reelyrated.test    | 08a4b898-3588-42c5-8f8e-0730e8bb1b17 |
| Normal   | normaluser@reelyrated.test | cfcf94ea-70dd-44e4-9476-5469f9153ed4 |
| Private  | private@reelyrated.test  | de23b791-fae0-42e4-9545-840874475821 |
| Blocked  | blocked@reelyrated.test  | cba190f0-cb8d-458a-b096-ec512cf91d35 |
| Viewer-A | viewer-a@reelyrated.test | 87b82436-f88a-4541-8064-5993b92d35ad |
| Viewer-B | viewer-b@reelyrated.test | 491c524a-8edb-4ef2-beaa-377469224146 |
| Viewer-C | viewer-c@reelyrated.test | 6dbde846-ada1-4ee9-83dc-ec7428b4c9b5 |

## Fixture state

- Admin row exists in public.admin_users: 1a04a24c-0307-4364-9967-7cc043bfbfbc
- Owner mapping exists in public.venue_owners: user_id 08a4b898-3588-42c5-8f8e-0730e8bb1b17, venue_id 2886fad6-ccbc-4b34-b03b-2be91e41c496, role = owner
- Block relationship exists in public.profile_blocks: blocker cba190f0-cb8d-458a-b096-ec512cf91d35, blocked 08a4b898-3588-42c5-8f8e-0730e8bb1b17

## Important notes (read before running probes)

- **Auth role vs anon:** `set local role anon;` simulates the Postgres `anon` role (no JWT). For authenticated probes, you must set Postgres role to `authenticated` **and** set JWT claims.
- **Run probes in a transaction:** use `BEGIN; ... ROLLBACK;` so `set local role` and `set_config(..., true)` remain transaction-scoped and don’t leak into later queries.
- **JWT claims:** `request.jwt.claim.sub` should be the Auth user id (UUID) for the persona.
- **RLS note:** using Studio/SQL editor generally runs with elevated privileges; these probes are for _simulating_ request context (policies/functions that reference `auth.uid()` and JWT claims).

## Probe template (copy/paste)

Use this when you want a quick “act as persona” block:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','<PERSONA_UID>',true);

-- your test queries here

rollback;
```

## SQL impersonation templates

> Tip: Wrap these blocks in `BEGIN; ... ROLLBACK;` when running in Studio so the settings stay transaction-local.

### anon

```sql
begin;
set local role anon;

-- your test queries here

rollback;
```

### Admin

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','1a04a24c-0307-4364-9967-7cc043bfbfbc',true);
```

### Owner

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','08a4b898-3588-42c5-8f8e-0730e8bb1b17',true);
```

### Normal

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','cfcf94ea-70dd-44e4-9476-5469f9153ed4',true);
```

### Private

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','de23b791-fae0-42e4-9545-840874475821',true);
```

### Blocked

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','cba190f0-cb8d-458a-b096-ec512cf91d35',true);
```

### Viewer-A

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','87b82436-f88a-4541-8064-5993b92d35ad',true);
```

### Viewer-B

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','491c524a-8edb-4ef2-beaa-377469224146',true);
```

### Viewer-C

```sql
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','6dbde846-ada1-4ee9-83dc-ec7428b4c9b5',true);
```

## Quick sanity checks (expected TRUE)

```sql
select public.is_admin(auth.uid());
select exists (select 1 from public.venue_owners where user_id = '08a4b898-3588-42c5-8f8e-0730e8bb1b17' and venue_id = '2886fad6-ccbc-4b34-b03b-2be91e41c496' and role = 'owner');
select public.is_blocked_either_way('cba190f0-cb8d-458a-b096-ec512cf91d35','08a4b898-3588-42c5-8f8e-0730e8bb1b17');
```

## When to use which persona

- Admin: admin-only controls, moderation, audit log, and hardening checks.
- Owner: owner-only venue management flows and venue owner rules.
- Normal: baseline authenticated user flows without elevated privileges.
- Private: scenarios involving private profiles/visibility controls.
- Blocked: blocked relationship scenarios (blocked vs owner) and deny paths.
- Viewer-A/B/C: public or follower-style viewing permutations when needed.
