# Query Keys and Cache Policy

## Canonical key patterns

Use stable array keys with a single params object when needed.

Examples:

- venueBySlug: ["venueBySlug", slug]
- feed: ["feed", { scope, filter, venueId, userId, sort }]
- catchById: ["catchById", catchId]
- catchComments: ["catchComments", catchId]
- profile: ["profile", slug]
- profileCatches: ["profileCatches", profileId]

## Default cache policy

Apply per-query defaults (do not set global defaults unless agreed):

- staleTime: 60_000 (60s)
- gcTime: 10 \* 60_000 (10m)
- refetchOnWindowFocus: false
- retry: false for user-triggered actions, true for background-only lists if desired
- keepPreviousData: true for paginated lists

## Per-query adjustments

- Feed (infinite): staleTime 30–60s, keepPreviousData true.
- CatchDetail: staleTime 60s, refetchOnWindowFocus false to prevent flash.
- Notifications: staleTime 15–30s if badge needs freshness.

## Example usage (pseudocode)

- venueBySlug:
  useQuery({
  queryKey: ["venueBySlug", { slug }],
  queryFn: () => supabase.rpc("get_venue_by_slug", { venue_slug: slug }),
  enabled: !!slug,
  staleTime: 60_000,
  gcTime: 600_000,
  refetchOnWindowFocus: false,
  })

# Query Keys and Cache Policy

## Canonical key patterns

Use stable **array keys**. Prefer a **single params object** only when needed.

Examples:

- venueBySlug: `["venueBySlug", slug]`
- feed: `["feed", { scope, filter, venueId, userId, sort }]`
- catchById: `["catchById", catchId]`
- catchComments: `["catchComments", catchId]`
- profile: `["profile", slug]`
- profileCatches: `["profileCatches", profileId]`
- notificationsList: `["notificationsList", userId, limit]`

### Params object guardrails (important)

If you use a params object in query keys:

- Only include **JSON-serializable primitives** (string/number/boolean/null) plus arrays/flat objects of the same.
- **No** `Date` objects (use ISO strings).
- **No** functions, class instances, Supabase clients, or non-deterministic values.
- Keep the params shape **stable** (same fields, same meaning).

Recommended: use a **key factory** so keys aren’t handwritten inconsistently:

```ts
export const qk = {
  venueBySlug: (slug: string) => ["venueBySlug", slug] as const,
  feed: (p: {
    scope: string;
    filter?: string;
    venueId?: string;
    userId?: string;
    sort?: string;
  }) => ["feed", p] as const,
  catchById: (catchId: string) => ["catchById", catchId] as const,
  catchComments: (catchId: string) => ["catchComments", catchId] as const,
  profile: (slug: string) => ["profile", slug] as const,
  profileCatches: (profileId: string) => ["profileCatches", profileId] as const,
};
```

## Default cache policy

Apply per-query defaults (do not set global defaults unless agreed):

### Detail reads (venue, catch)

- `staleTime`: `60_000` (60s)
- `gcTime`: `10 * 60_000` (10m)
- `refetchOnWindowFocus`: `false` (prevents UI flash on tab focus)
- `retry`: `false` (avoid surprise retries on user-facing detail screens)

### Lists (feed, notifications)

- `staleTime`: `15_000–60_000` depending on freshness needs
- `gcTime`: `10m` (or longer if lists are expensive)
- `refetchOnWindowFocus`: `false` unless explicitly required
- `retry`: consider `1` for background-only lists, but keep `false` for user-triggered screens

> Note: For TanStack Query v5, “keep previous data” is typically achieved via `placeholderData: keepPreviousData`.

## Per-query adjustments

- **Feed (infinite):** `staleTime` 30–60s, `placeholderData: keepPreviousData`.
- **CatchDetail:** `staleTime` 60s, `refetchOnWindowFocus: false` to prevent flash.
- **Notifications:** `staleTime` 15–30s if badge needs freshness.

## Supabase queryFn rule

Supabase calls return `{ data, error }`. Always throw errors inside `queryFn`:

```ts
const venueBySlugQueryFn = async (slug: string) => {
  const { data, error } = await supabase.rpc("get_venue_by_slug", {
    venue_slug: slug,
  });
  if (error) throw error;
  return data;
};
```

## User scoping rule

If results differ per user/role, the query key **must include** a stable user discriminator:

- Use `userId` (or the literal string `"anon"`) in keys for user-specific reads.

Examples:

- `["venueRating", { userId, venueId }]`
- `["myProfile", { userId }]`

## Cache update vs invalidation (quick rule)

- Prefer `queryClient.setQueryData(...)` when the mutation result can deterministically update the cache.
- Use `invalidateQueries(...)` when multiple lists depend on the data or patching is risky.

# Query Keys and Cache Policy (TanStack Query v5)

This doc is the **single source of truth** for how we shape React Query keys and caching across the app.

## Decision

We use **global defaults as a conservative baseline**, then **override per-query** when a screen needs different freshness or retry behavior.

Why:

- Keeps behavior **predictable** across the app (less “surprise staleness” or surprise retries).
- Reduces per-page boilerplate.
- Lets us tune one place as we learn (global defaults), while still allowing targeted overrides.

---

## 1) Query key rules

### Use stable array keys

- Keys are always arrays.
- Prefer **primitive segments** (strings) for simple identifiers.
- Only use a params object when you genuinely need multiple parameters.

**Preferred examples**

- Venue by slug: `['venueBySlug', slug]`
- Catch by id: `['catchById', catchId]`
- Catch comments: `['catchComments', catchId]`

**When a params object makes sense** (multi-dimensional)

- Feed: `['feed', { scope, filter, venueId, userId, sort }]`

### Params object guardrails

If you put an object in a query key:

- Only **JSON-serializable primitives** (string/number/boolean/null) plus arrays/flat objects of the same.
- **No** `Date` objects (use ISO strings).
- **No** functions, class instances, Supabase clients, or non-deterministic values.
- Keep the params shape **stable** (same fields, same meaning).

### User scoping rule

If results differ per user/role, the key **must include a stable user discriminator**.

- Use `userId` when signed in.
- Use the literal string `'anon'` when logged out.

Examples:

- `['venueRating', userId ?? 'anon', venueId]`
- `['myProfile', userId]`

### Recommended key factory

Use a key factory so we don’t hand-write keys inconsistently:

```ts
export const qk = {
  venueBySlug: (slug: string) => ["venueBySlug", slug] as const,
  catchById: (catchId: string) => ["catchById", catchId] as const,
  catchComments: (catchId: string) => ["catchComments", catchId] as const,
  catchRatingSummary: (catchId: string, userId: string | null | undefined) =>
    ["catchRatingSummary", catchId, userId] as const,
  catchReactions: (catchId: string, userId: string | null | undefined) =>
    ["catchReactions", catchId, userId] as const,
  catchFollowStatus: (userId: string | null | undefined, ownerId: string | null | undefined) =>
    ["catchFollowStatus", userId, ownerId] as const,

  venueRating: (userId: string | null | undefined, venueId: string | null | undefined) =>
    ["venueRating", userId, venueId] as const,
  venueOpeningHours: (venueId: string | null | undefined) =>
    ["venueOpeningHours", venueId] as const,
  venuePricingTiers: (venueId: string | null | undefined) =>
    ["venuePricingTiers", venueId] as const,
  venueRules: (venueId: string | null | undefined) => ["venueRules", venueId] as const,

  feed: (p: {
    scope: string;
    filter?: string;
    venueId?: string;
    userId?: string;
    sort?: string;
  }) => ["feed", p] as const,

  profile: (slug: string) => ["profile", slug] as const,
  profileCatches: (profileId: string | null | undefined) =>
    ["profileCatches", profileId] as const,
  profileFollowerCount: (profileId: string | null | undefined) =>
    ["profileFollowerCount", profileId] as const,
  profileFollowing: (profileId: string | null | undefined) =>
    ["profileFollowing", profileId] as const,
  profileFollowStatus: (viewerId: string | null | undefined, profileId: string | null | undefined) =>
    ["profileFollowStatus", viewerId, profileId] as const,
  profileBlockStatus: (viewerId: string | null | undefined, profileId: string | null | undefined) =>
    ["profileBlockStatus", viewerId, profileId] as const,

  adminStatus: (userId: string | null | undefined) => ["adminStatus", userId] as const,

  notificationsList: (userId: string | null | undefined, limit: number) =>
    ["notificationsList", userId, limit] as const,
} as const;
```

---

## 2) Global defaults

We **do** set global defaults on the QueryClient. These are the baseline; screens may override.

**Recommended baseline defaults**

- `staleTime`: `30_000` (30s)
- `gcTime`: `10 * 60_000` (10m)
- `refetchOnWindowFocus`: `false` (prevents tab-focus UI flash)
- `retry`: `1` (helps with transient network blips)

Notes:

- If a screen is sensitive to retries (e.g., user-triggered detail fetch that shows errors), set `retry: false` on that query.
- For TanStack Query v5, “keep previous data” is typically `placeholderData: keepPreviousData`.

---

## 3) Per-query adjustments

### Detail reads (venue, catch)

Typical overrides (when needed):

- `staleTime`: `60_000` (60s)
- `retry`: `false` if we’d rather surface errors immediately than retry

### Lists (feed, notifications)

- Feed (infinite): `staleTime` `15_000–30_000` and `placeholderData: keepPreviousData`
- Notifications badge/surfaces: `staleTime` `15_000–30_000` depending on how “live” it must feel

### Mutations

- Prefer `queryClient.setQueryData(...)` when the mutation result can deterministically patch the cache.
- Use `invalidateQueries(...)` when multiple lists depend on the data or patching is risky.

---

## 4) Supabase queryFn rule

Supabase calls return `{ data, error }`. Always throw inside `queryFn`:

```ts
const venueBySlugQueryFn = async (slug: string) => {
  const { data, error } = await supabase.rpc("get_venue_by_slug", {
    venue_slug: slug,
  });
  if (error) throw error;
  return data;
};
```

---

## 5) Migration guardrails

- If you migrate a page to React Query, update `03-INVALIDATION-MATRIX.md` to reflect what’s **actually implemented**.
- Avoid parallel caching layers unless documented (e.g., temporary LRU caches during migration) and clear them on auth changes.
