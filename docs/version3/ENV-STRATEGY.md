# Environment & Database Strategy

This document explains how we structure our environments, branches, and migrations so we can:

- Develop new features safely.
- Preserve real user data in production.
- Avoid the “branch is 72 commits ahead and migrations explode” problem.

---

## 1. Goals

- **Prod is sacred**: never break real users or their data.
- **Dev is flexible**: we can experiment, reset data, tweak RLS, and iterate fast.
- **One linear migration history**: we don’t edit old migrations; we only add new ones.
- **Each branch has a “home” database**: no more one branch writing migrations for a different DB.

---

## 2. Supabase Projects

We use (at least) two Supabase projects:

### 2.1 Production Project (`reelyrated-prod`)

- Holds **real user data**.
- Mirrors the `main` branch of the repo.
- Schema changes are applied **only when we are ready to deploy**, via `supabase db push` against this project.
- No experimental migrations or half-baked features here.

### 2.2 Dev / Hardening Project (`reelyrated-v3-dev`)

- Used for **active development and hardening** (v3).
- Mirrors the `v3-hardening` (or `develop`) branch.
- We run:
  - New migrations
  - RLS and RPC changes
  - Schema experiments
- It’s safe to:
  - Reset data
  - Seed fake data
  - Roll forward/backward as needed

Optional later:

### 2.3 Feature / Ephemeral Projects (Optional)

- For big risky experiments (not required initially).
- Short-lived, used only by a feature branch.

---

## 3. Git Branch Strategy

### 3.1 `main`

- Mirrors **production**.
- Deployed to users.
- Only receives:
  - Tested features from `v3-hardening`.
  - Migrations that have already been applied & verified on the dev project.

### 3.2 `v3-hardening` (or `develop`)

- Mirrors the **dev Supabase project**.
- All current v3 work lives here:
  - Types alignment
  - RLS hardening
  - RPC design
  - ERD & docs
- All new migrations are created and first applied against the dev project.

### 3.3 Feature Branches

- Short-lived branches off `v3-hardening`, e.g.:
  - `feature/new-venue-card`
  - `feature/profile-blocks-ux`
- Flow:
  1. Branch off `v3-hardening`.
  2. Implement feature + migrations.
  3. Apply migrations to **dev** project.
  4. Test.
  5. Merge back into `v3-hardening`.

---

## 4. Migration Rules

### 4.1 Never Edit Old Migrations

From this point forward:

- Do **not** change existing migration files.
- If something is wrong:
  - Add a **new** migration that fixes/renames/drops/adjusts.
  - Treat old migrations as an immutable history.

### 4.2 Single Linear History

- Every migration in `supabase/migrations` is part of **one linear chain**.
- No “branch-only” migrations that never go to main.
- If it’s in the repo, we assume it will eventually run in both dev and prod.

### 4.3 Dev First, Then Prod

**Dev flow:**

```bash
# On v3-hardening or a feature branch, linked to DEV project
supabase link --project-ref <dev_project_ref>
supabase db push --include-all
```
