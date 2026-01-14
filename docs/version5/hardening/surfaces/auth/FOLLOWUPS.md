# Followups

> Followups are _sweep_ tasks and risk checks. They do not assert that testing has been completed.
> Canonical, code-referenced behavior for this surface lives in `PIPELINE.md`.

## Enumeration parity (UI + network)

- [ ] Sign-in parity: wrong-email vs wrong-password must be indistinguishable (UI copy + status/shape + timing).
- [ ] Reset request parity: existing vs non-existing email must be indistinguishable (UI copy + status/shape + timing).
- [ ] Sign-up parity:
  - [ ] Existing vs non-existing username (pre-check) — confirm UI copy parity and record whether network response differs (rowcount/size/timing).
  - [ ] Existing vs non-existing email (provider/GoTrue behavior) — ensure UI remains generic and does not confirm existence.

## OAuth + redirects

- [ ] OAuth redirect target allow-list confirmed (dev + prod) in Supabase Redirect URLs config (capture screenshot evidence).
- [ ] Wildcards (if used for preview URLs): confirm scope is not overly broad (avoid `**` outside local dev) and record the exact patterns configured. citeturn0search2
- [ ] OAuth return safety: capture return URL shape (query/hash) and confirm no access/refresh tokens are retained in the URL; if a PKCE auth `code` appears, record whether it is removed after session establishment.
- [ ] Return path parameters:
  - [ ] Codebase truth: this surface does **not** currently support `returnTo`/`next` query params.
  - [ ] If introduced later, enforce relative-only paths (must start with `/`) and default to `/` on invalid input.

## Rate limiting

- [ ] Confirm Supabase Auth server-side rate limits are enabled/configured for sign-in/reset and capture the relevant project settings as evidence. citeturn0search3
- [ ] App-level rate-limit posture: verify `rate_limits` table/policies/functions (if present) are least-privilege and are not relied upon as the only control for auth endpoints.

## Reset flow integrity

- [ ] Confirm reset view requires a valid recovery session and cannot set passwords without a valid session.
- [ ] Confirm invalid/expired reset tokens fail generically (no detail leakage).

## Database posture (public exposure + side-effects)

- [ ] Confirm `profiles_select_all` usage for anon username checks remains minimal (selects only `id`).
- [ ] Confirm `profiles` schema remains public-safe under `profiles_select_all` (capture column inventory and assess sensitive fields).
- [ ] Verify `public.handle_new_user` SECURITY DEFINER posture: schema-qualified references + pinned `search_path` and least-privilege grants.

## Deleted-account gating

- [ ] Confirm deleted-account flow end-to-end: sign-in check of `profiles.is_deleted`, then `DeletedAccountGate` sign-out and `/account-deleted` redirect behave as expected.
- [ ] Confirm `/account-deleted` page exposes only public-safe messaging and navigation back to `/auth`.

## Misc query params

- [ ] Validate `/auth?fromEmailChange=true` is ignored by the Auth surface (does not change views or enable unexpected state changes) and has safe UX.
