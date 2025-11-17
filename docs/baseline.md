# ReelyRated Security Audit — Phase 0: Baseline Report

**Date:** 2025-11-12
**Branch:** `claude/security-audit-reely-rated-011CV3gzBVqKdEhgQFCHxNUv`
**Auditor:** Principal Engineer & Security Lead
**Status:** ✅ Complete (Phase 0 — Inventory & Baseline)

---

## Executive Summary

This Phase 0 baseline establishes the **current state** of the ReelyRated web application prior to implementing security improvements. The application is a React + TypeScript + Vite + Supabase fishing social platform with **solid foundational architecture** but several **critical security gaps** requiring immediate attention.

**Key Findings:**
- 🟢 **Strengths:** Security headers configured, RLS policies comprehensive, database-driven admin auth, zero npm vulnerabilities
- 🔴 **Critical Issues:** 2 critical (storage bucket path traversal, admin disclosure)
- 🟠 **High Priority:** 6 high-priority items (TypeScript strict mode, pagination, bundle size, input validation)
- 🟡 **Medium Priority:** 8 medium-priority improvements
- **Previous Audits:** Two comprehensive security audits completed (2025-11-11); several critical fixes already applied

---

## 1. Codebase Inventory

### 1.1 Technology Stack

| Component | Version | Notes |
|-----------|---------|-------|
| **Runtime** | Node.js (npm-based) | No version lock detected |
| **Framework** | React 18.3.1 | Modern, stable |
| **Build Tool** | Vite 7.2.2 | Latest major version |
| **Language** | TypeScript 5.8.3 | ⚠️ **NOT in strict mode** |
| **Backend** | Supabase (supabase-js 2.77.0) | Postgres + RLS + Auth |
| **State** | @tanstack/react-query 5.83.0 | Proper caching configured |
| **Routing** | react-router-dom 6.30.1 | Client-side SPA routing |
| **UI Library** | shadcn/ui + Radix UI | Accessible component primitives |
| **Validation** | Zod 3.25.76 | ⚠️ **Available but underutilised** |
| **Charts** | Nivo 0.99.0, Recharts 2.15.4 | Large chart libraries |
| **Testing** | Vitest 4.0.8 + Testing Library | Limited test coverage |
| **Deployment** | Vercel (vercel.json) | Security headers configured ✅ |

### 1.2 File Structure

```
ReelyRated-Codex/
├── src/
│   ├── components/          # 70+ React components
│   │   ├── ui/              # 40+ shadcn/ui components
│   │   ├── AuthProvider.tsx
│   │   ├── Navbar.tsx
│   │   ├── Leaderboard.tsx
│   │   └── ...
│   ├── pages/               # 15 route pages
│   │   ├── Index.tsx        # Landing (eager-loaded)
│   │   ├── Auth.tsx         # Auth (eager-loaded)
│   │   ├── Feed.tsx         # Main feed (lazy)
│   │   ├── AddCatch.tsx
│   │   ├── CatchDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── AdminReports.tsx
│   │   ├── AdminAuditLog.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAdminAuth.ts  # ✅ Async admin check
│   │   ├── useNotifications.ts
│   │   └── ...
│   ├── lib/                 # Business logic
│   │   ├── admin.ts         # ✅ Database-driven admin checks
│   │   ├── storage.ts       # Avatar upload logic
│   │   ├── notifications.ts
│   │   ├── search.ts
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Supabase initialisation
│   │       └── types.ts     # Auto-generated DB types ✅
│   └── test/                # Limited test setup
├── supabase/
│   └── migrations/          # 13 SQL migration files
│       ├── 20251031170000_apply_rls.sql  # ✅ Comprehensive RLS
│       ├── 20251031160000_add_avatars_bucket.sql  # ⚠️ Weak policies
│       ├── 20251031164000_create_admin_users.sql
│       └── ...
├── scripts/                 # Seed & cleanup scripts
├── docs/                    # Audit documentation (this dir)
├── vite.config.ts
├── tsconfig.json            # ⚠️ NOT strict
├── vercel.json              # ✅ Security headers configured
└── package.json
```

### 1.3 Dependencies Audit

**Total Dependencies:** 603 packages
**Vulnerabilities:** **0 critical, 0 high, 0 medium** ✅
**Last Checked:** 2025-11-12

**Key Production Dependencies:**
- `@supabase/supabase-js` (2.77.0) — Database & auth client
- `@tanstack/react-query` (5.83.0) — Data fetching & caching
- `react-router-dom` (6.30.1) — Routing
- `zod` (3.25.76) — Schema validation (⚠️ underutilised)
- `react-hook-form` + `@hookform/resolvers` — Form management
- `@nivo/bar`, `@nivo/line`, `recharts` — ⚠️ Large chart libraries (bundle impact)
- `html2canvas` (1.4.1) — Screenshot generation
- `date-fns` (3.6.0) — Date utilities

**Development Dependencies:**
- `vitest` (4.0.8) — Unit testing
- `@testing-library/react` (14.2.2)
- `eslint` (9.32.0)
- `typescript` (5.8.3)

**Missing/Recommended:**
- ❌ No runtime type validation on API responses (Zod available but not wired up)
- ❌ No E2E testing framework (Playwright/Cypress)
- ❌ No bundle analyser (e.g., `rollup-plugin-visualizer`)

---

## 2. Route Map & Authentication

### 2.1 Routes

| Path | Component | Auth Required | Lazy Loaded | Notes |
|------|-----------|---------------|-------------|-------|
| `/` | Index | No | ❌ Eager | Landing page |
| `/auth` | Auth | No | ❌ Eager | Login/signup |
| `/feed` | Feed | Yes | ✅ | Main content feed |
| `/leaderboard` | LeaderboardPage | Yes | ✅ | Species leaderboards |
| `/add-catch` | AddCatch | Yes | ✅ | Upload catch |
| `/catch/:id` | CatchDetail | Conditional | ✅ | Public/followers/private visibility |
| `/profile/:slug` | Profile | Conditional | ✅ | User profiles |
| `/settings/profile` | ProfileSettings | Yes | ✅ | User settings |
| `/sessions` | Sessions | Yes | ✅ | Fishing session tracking |
| `/admin/reports` | AdminReports | **Admin only** | ✅ | ⚠️ Client-side guard only |
| `/admin/audit-log` | AdminAuditLog | **Admin only** | ✅ | ⚠️ Client-side guard only |
| `/search` | SearchPage | Yes | ✅ | Global search |
| `/insights` | Insights | Yes | ✅ | Analytics/charts |
| `/venues/:slug` | VenueDetail | Conditional | ✅ | Venue pages |
| `/*` | NotFound | No | ✅ | 404 handler |

### 2.2 Authentication Flow

**Provider:** Supabase Auth (email/password, social providers)
**Storage:** `localStorage` (persistent sessions) ✅
**Token Refresh:** Auto-refresh enabled ✅
**Context:** `AuthProvider` wraps all routes, exposes `{ user, session, loading }`

**Security Observations:**
- ✅ Auth state properly subscribed via `onAuthStateChange`
- ✅ Session properly initialised on mount
- ✅ Navigation guards redirect unauthenticated users to `/auth`
- ⚠️ Admin routes use **client-side checks only** (`useAdminAuth` hook) — must verify RLS enforcement
- ⚠️ No route-level error boundaries
- ⚠️ No session timeout/idle detection

---

## 3. Environment Variables

### 3.1 Required Variables

| Variable | Sensitivity | Validation | Notes |
|----------|-------------|------------|-------|
| `VITE_SUPABASE_URL` | Public | ❌ None | Supabase project URL (safe to expose) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | ❌ None | Anon/public key (safe, RLS-protected) |

### 3.2 Optional Variables

| Variable | Sensitivity | Usage | Notes |
|----------|-------------|-------|-------|
| `VITE_PUBLIC_SITE_URL` | Public | Share URLs | Defaults to `http://localhost:8080` if missing |

### 3.3 Security Assessment

✅ **No secrets in client bundle** (previous `VITE_ADMIN_USER_IDS` vulnerability removed)
✅ **Properly gitignored** (`.env`, `.env.local`)
❌ **No `.env.example`** file for contributors
❌ **No runtime validation** of required env vars (app fails silently if missing)

**Recommendation:** Add startup validation:

```typescript
// src/integrations/supabase/client.ts
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required environment variables');
}
```

---

## 4. Build Metrics

### 4.1 Build Output (2025-11-12)

**Build Time:** 15.32 seconds
**Total Bundle Size:** 1.7 MB (uncompressed), ~434 KB (gzipped estimate)
**Vite Version:** 7.2.2

### 4.2 Chunk Analysis

| File | Size (uncompressed) | Gzipped | Status |
|------|---------------------|---------|--------|
| `index-ZvxODzII.js` | **584 KB** | ~182 KB | 🔴 **CRITICAL** — Main chunk too large |
| `Insights-CxhSOx-6.js` | **433 KB** | ~146 KB | 🔴 **CRITICAL** — Chart libraries |
| `CatchDetail-DR7iihhL.js` | **234 KB** | ~60 KB | 🟠 **WARNING** |
| `AddCatch-DR_hmrEC.js` | 46 KB | ~14 KB | ✅ OK |
| `select-C1O8IYIf.js` | 21 KB | ~7 KB | ✅ OK |
| `Profile-Cmc9Q6aQ.js` | 18 KB | ~5 KB | ✅ OK |
| Other chunks | < 20 KB each | — | ✅ OK |
| `index.css` | 119.62 KB | ~20 KB | ✅ Acceptable |

**Vite Warning:**
```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
```

### 4.3 Performance Implications

🔴 **Initial Load:** ~180 KB (gzipped) JavaScript for main chunk = **slow on 3G/4G**
🔴 **Insights Page:** Additional 146 KB for charts = **~326 KB total JS**
🟡 **CSS:** 20 KB gzipped is acceptable
✅ **Code Splitting:** Lazy loading implemented for all routes except Index/Auth
⚠️ **Images:** `hero-fish.jpg` is 136 KB — no optimisation detected (WebP, responsive images)

---

## 5. Supabase Configuration

### 5.1 Client Initialisation

**File:** `src/integrations/supabase/client.ts`

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,        // ✅ Persistent sessions
    persistSession: true,          // ✅ Survives page reloads
    autoRefreshToken: true,        // ✅ Token refresh enabled
  }
});
```

**Security Assessment:**
- ✅ Uses generated TypeScript types (`Database` from `types.ts`)
- ✅ Auto-refresh prevents session expiry during active use
- ⚠️ No custom `flowType` or `detectSessionInUrl` config (may affect OAuth flows)
- ⚠️ No custom session expiry (defaults to Supabase project settings)

### 5.2 RLS Policy Coverage

**Migration:** `supabase/migrations/20251031170000_apply_rls.sql` (592 lines)

**Tables with RLS Enabled:** ✅ All 20 user-facing tables

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `profiles` | ✅ All | ❌ | ✅ Own | ❌ | Publicly viewable |
| `admin_users` | 🔴 **All** | ✅ Self | ❌ | ✅ Self | **CRITICAL:** Admin list readable by all |
| `catches` | ✅ Visibility-aware | ✅ Own | ✅ Own | ✅ Own | Respects `public`/`followers`/`private` |
| `catch_comments` | ✅ Catch visibility | ✅ Auth | ✅ Own | ✅ Own | Proper access control |
| `catch_reactions` | ✅ Catch visibility | ✅ Own | ✅ Own | ✅ Own | Proper |
| `catch_ratings` | ✅ Catch visibility | ✅ Own | ✅ Own | ✅ Own | Proper |
| `sessions` | ✅ Visibility-aware | ✅ Own | ✅ Own | ✅ Own | Proper |
| `notifications` | ✅ Own | ✅ Auth | ✅ Own | ❌ | Users can't delete notifications |
| `reports` | ✅ Reporter or admin | ✅ Auth | ✅ Admin | ❌ | Admin enforcement ✅ |
| `profile_follows` | ✅ Auth | ✅ Own | ❌ | ✅ Own | Proper |
| `venues` | ✅ All | ✅ Own | ✅ Own | ✅ Own | Proper |
| `tags` | ✅ All | ✅ Admin | ❌ | ✅ Admin | Admin-managed |
| `baits` | ✅ All | ✅ Admin | ❌ | ✅ Admin | Admin-managed |

**Critical Finding:**
```sql
-- Line 59 of apply_rls.sql
create policy "Admin list readable"
  on public.admin_users for select using (true);
```

🔴 **SECURITY ISSUE:** Any authenticated user can query `admin_users` table and discover who the admins are. This enables **targeted attacks** and **social engineering**.

**Recommended Fix:**
```sql
-- Only allow users to check their own admin status
create policy "Users can check own admin status"
  on public.admin_users for select
  using (auth.uid() = user_id);
```

### 5.3 Storage Bucket Policies

**Migration:** `supabase/migrations/20251031160000_add_avatars_bucket.sql`

**Bucket:** `avatars` (public)

```sql
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );
```

🔴 **CRITICAL VULNERABILITY (CWE-22, CWE-284):**

**Path Traversal Risk:** No path restriction — user can upload to **any path** in the bucket:

```typescript
// Attacker can upload to another user's folder:
await supabase.storage
  .from('avatars')
  .upload('victim-uuid/malicious.svg', file); // ✅ Allowed!
```

**Recommended Fix:**
```sql
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Client-Side Mitigation (Insufficient):**
`src/lib/storage.ts` enforces path as `${userId}/${uniqueSuffix}.${extension}`, **but client-side validation can be bypassed**.

---

## 6. TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "noImplicitAny": false,           // 🔴 CRITICAL: Allows implicit any
    "noUnusedParameters": false,      // ⚠️ Allows unused params
    "skipLibCheck": true,             // ⚠️ Skips type checking in node_modules
    "allowJs": true,                  // ⚠️ Allows .js files
    "noUnusedLocals": false,          // ⚠️ Allows unused variables
    "strictNullChecks": false         // 🔴 CRITICAL: null/undefined not checked
  }
}
```

🔴 **MAJOR CODE QUALITY ISSUE:**

TypeScript is **NOT in strict mode**. This allows:
- Implicit `any` types (bypassing type safety)
- Null/undefined access without checks (runtime errors)
- Unused code accumulation

**Impact:**
- **Security:** Type confusion bugs can lead to logic errors and potential vulnerabilities
- **Reliability:** Null pointer exceptions at runtime
- **Maintainability:** Type safety provides limited value

**OWASP Mapping:** A04:2021 (Insecure Design) — lack of type safety increases attack surface

**Phase 4 Priority:** Enable `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

---

## 7. Data Fetching & Pagination

### 7.1 React Query Configuration

**File:** `src/App.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // ✅ 5 minutes
      gcTime: 10 * 60 * 1000,        // ✅ 10 minutes cache
      refetchOnWindowFocus: false,   // ✅ Prevents unnecessary refetches
      retry: 1,                      // ✅ Single retry
    },
  },
});
```

**Assessment:** ✅ Well-configured for performance and UX

### 7.2 Pagination Analysis

**Files Checked:** `Feed.tsx`, `Leaderboard.tsx`, `Profile.tsx`, `Search.tsx`

🟠 **MAJOR PERFORMANCE ISSUE:**

**No cursor-based (keyset) pagination detected.** Most queries use:
- `limit` parameter only (e.g., `.limit(50)` in Leaderboard)
- **No `offset`** or **cursor continuation**
- **No `useInfiniteQuery`** from React Query

**Example (Feed.tsx:94):**
```typescript
const { data, error } = await supabase
  .from("catches")
  .select(`*, profiles(*), ratings(*), comments(*), reactions(*)`)
  .order("created_at", { ascending: false });
  // ❌ No .limit(), loads ALL catches into memory
```

**Consequences:**
- Database loads **all rows** for every request (expensive)
- Frontend receives **unbounded** result sets
- **Performance degrades** as data grows
- Concurrent inserts cause **duplicate/skipped entries** with offset pagination
- **DoS risk:** Malicious user could create thousands of entries

**Phase 3 Priority:** Implement keyset pagination with `useInfiniteQuery`

---

## 8. Security Headers & CSP

**File:** `vercel.json`

✅ **ALL CRITICAL HEADERS CONFIGURED:**

```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy", "value": "..." },
      { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(self), payment=()" },
      { "key": "X-XSS-Protection", "value": "1; mode=block" }
    ]
  }]
}
```

**CSP Breakdown:**
- `default-src 'self'` — Only same-origin resources
- `script-src 'self'` — No inline scripts ✅
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — ⚠️ `unsafe-inline` for Tailwind (acceptable for CSS)
- `img-src 'self' https://*.supabase.co https: data: blob:` — Allows Supabase storage + external images
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co` — API + WebSocket
- `frame-src https://www.google.com` — Google Maps embeds
- `frame-ancestors 'none'` — Prevents clickjacking ✅
- `upgrade-insecure-requests` — Forces HTTPS ✅

**Assessment:**
- ✅ **Excellent** security posture
- ⚠️ `img-src https:` is broad (allows any HTTPS image) — consider restricting to known domains
- ⚠️ No CSP violation reporting endpoint configured

**Verification Command:**
```bash
curl -I https://your-production-domain.vercel.app | grep -i "content-security-policy"
```

---

## 9. Input Validation & XSS Risk

### 9.1 User-Generated Content

**Locations:**
- Catch titles, descriptions (rendered in Feed, CatchDetail)
- Comments (CatchComments component)
- Profile bios, usernames
- Venue names, descriptions

**Current Mitigation:**
✅ React escapes content by default in `{variable}` syntax
❌ **No explicit sanitisation library** (DOMPurify, sanitize-html)
❌ **No Zod validation** on form inputs (Zod is installed but not wired up)
⚠️ `dangerouslySetInnerHTML` usage not detected (good)

**Risk Assessment:**
- 🟢 **XSS via text:** Low risk (React auto-escapes)
- 🟠 **XSS via attributes:** Medium risk (e.g., `<img src={userInput}>` without validation)
- 🟠 **Stored XSS via SVG uploads:** Risk if SVG files allowed in avatars (needs verification)
- 🟡 **SQL Injection:** Mitigated by Supabase parameterised queries ✅

**Phase 2/3 Priority:**
- Add Zod schema validation to all forms
- Validate file uploads (MIME type, file signatures)
- Add CSP violation reporting

---

## 10. Error Handling & Observability

### 10.1 Error Boundaries

**Search Results:** ❌ **No error boundary components found**

**Risk:** React will **unmount entire app** on component errors, showing blank screen to users.

**Phase 6 Priority:** Add `ErrorBoundary` wrapper around routes

### 10.2 Logging & Monitoring

**Current State:**
- ✅ `console.error()` used in catch blocks
- ❌ No structured logging
- ❌ No error tracking service (Sentry, LogRocket, etc.)
- ❌ No correlation IDs for request tracing
- ❌ No performance monitoring

**Phase 6 Priority:** Implement structured logging + error tracking

---

## 11. Testing Infrastructure

**Test Framework:** Vitest 4.0.8 + @testing-library/react 14.2.2

**Files Found:**
- `src/test/setupTests.ts` — Test environment setup
- `src/components/__tests__/NotificationsBell.test.tsx`
- `src/lib/__tests__/notifications.test.ts`
- `src/lib/__tests__/notifications-utils.test.ts`

**Coverage:** ⚠️ **Minimal** (4 test files for 70+ components)

**Missing:**
- ❌ Integration tests
- ❌ E2E tests (Playwright/Cypress)
- ❌ Visual regression tests
- ❌ Security-focused tests (RLS policy tests, auth flow tests)

**Phase 2/6 Priority:** Add negative tests for auth/admin flows

---

## 12. CI/CD & Deployment

**Platform:** Vercel (detected via `vercel.json`)

**Scripts (package.json):**
- `dev` — Local development server
- `build` — Production build
- `preview` — Preview build
- `lint` — ESLint
- `test` — Vitest unit tests

**Missing:**
- ❌ No `.github/workflows` or CI configuration detected
- ❌ No automated security scanning (Snyk, npm audit in CI)
- ❌ No pre-commit hooks (Husky)
- ❌ No lighthouse CI
- ❌ No build size tracking

**Phase 8 Priority:** Add CI pipeline with security checks

---

## 13. Lighthouse Snapshot (Estimated)

**Note:** Actual Lighthouse audit not performed (would require deployed environment). Estimates based on bundle analysis:

| Metric | Estimate | Grade | Notes |
|--------|----------|-------|-------|
| **Performance** | 65-75 | 🟡 C | Large JS bundles (584 KB main chunk) |
| **Accessibility** | 85-90 | 🟢 B+ | Radix UI primitives are accessible |
| **Best Practices** | 90-95 | 🟢 A- | Security headers configured |
| **SEO** | 80-85 | 🟢 B+ | SPA (client-side routing may hurt SEO) |

**Key Issues:**
- 🔴 **First Contentful Paint (FCP):** Likely 2-3s on 3G (large bundles)
- 🔴 **Time to Interactive (TTI):** 3-4s (large JS parse/execute)
- 🟢 **Largest Contentful Paint (LCP):** Likely OK (hero image 136 KB)
- 🟢 **Cumulative Layout Shift (CLS):** Likely good (React Query loading states)

**Phase 5 Priority:** Bundle splitting, image optimisation

---

## 14. Top Errors & Known Issues

### From Previous Audits (2025-11-11)

**Resolved:**
1. ✅ Client-side admin authorisation (now database-driven)
2. ✅ Missing security headers (now configured)
3. ✅ Synchronous admin checks (now async with `useAdminAuth`)

**Unresolved (Carried Forward):**
1. 🔴 Storage bucket path traversal (admin_users readable, avatars upload path)
2. 🔴 TypeScript not in strict mode
3. 🟠 No pagination (unbounded queries)
4. 🟠 Bundle size (584 KB main chunk)
5. 🟠 No input validation with Zod
6. 🟠 No error boundaries
7. 🟡 Image optimisation (hero-fish.jpg 136 KB)
8. 🟡 No E2E tests

---

## 15. Baseline Metrics Summary

| Category | Metric | Value | Target |
|----------|--------|-------|--------|
| **Dependencies** | npm audit vulnerabilities | 0 | 0 ✅ |
| **Build** | Build time | 15.32s | < 20s ✅ |
| **Build** | Main bundle (gzip) | ~182 KB | < 100 KB 🔴 |
| **Build** | Total JS (gzip) | ~434 KB | < 200 KB 🔴 |
| **Build** | CSS (gzip) | ~20 KB | < 30 KB ✅ |
| **Code Quality** | TypeScript strict | ❌ No | ✅ Yes 🔴 |
| **Code Quality** | ESLint errors | 0 (assumed) | 0 ✅ |
| **Testing** | Unit test coverage | < 5% | > 80% 🔴 |
| **Security** | RLS enabled tables | 20/20 | 20/20 ✅ |
| **Security** | Security headers | 7/7 | 7/7 ✅ |
| **Security** | Critical vulns | 2 | 0 🔴 |
| **Performance** | Routes lazy-loaded | 13/15 | 15/15 🟡 |
| **Performance** | Pagination implemented | ❌ No | ✅ Yes 🔴 |

---

## 16. Quick Wins (Can Complete in < 1 hour)

1. ✅ **Add `.env.example`** with required variables
2. ✅ **Fix admin_users RLS policy** (restrict SELECT to own user)
3. ✅ **Add env variable validation** in `client.ts` (fail fast on missing vars)
4. ✅ **Add basic ErrorBoundary** wrapper
5. ✅ **Optimise hero-fish.jpg** (convert to WebP, add srcset)

---

## Next Steps: Phase 1 Proposal

See **`docs/risk-register.md`** for full prioritised findings.

**Phase 1 Focus:** Security Surface (Headers, CORS, Secrets)

**Proposed Fixes:**
1. Fix storage bucket RLS policies (path enforcement)
2. Restrict admin_users SELECT policy
3. Add env variable validation
4. Add `.env.example`
5. Audit for any remaining hardcoded secrets
6. Verify CSP in production (curl test)
7. Add CSP violation reporting endpoint

**Verification:**
- Negative tests: Attempt path traversal in avatar upload
- Negative tests: Non-admin user queries admin_users table
- cURL production headers
- Build passes with env validation

**Rollback:** Git revert if RLS policies break avatar uploads

---

## Appendices

### A. File Counts

```bash
TypeScript files: 80+
React components: 70+
Pages: 15
Hooks: 10+
SQL migrations: 13
```

### B. Environment Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm run test

# Lint
npm run lint
```

### C. Supabase Local Development

```bash
# Seed local database
npm run seed:local

# Seed remote (requires SUPABASE_URL, SERVICE_ROLE_KEY)
npm run seed:remote
```

---

**End of Phase 0 Baseline Report**
**Next:** `docs/risk-register.md` → Phase 1 planning
