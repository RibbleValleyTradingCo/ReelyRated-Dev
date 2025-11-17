# ReelyRated Security Audit — Risk Register

**Date:** 2025-11-12
**Branch:** `claude/security-audit-reely-rated-011CV3gzBVqKdEhgQFCHxNUv`
**Status:** Phase 0 Complete
**Auditor:** Principal Engineer & Security Lead

---

## Executive Summary

This risk register catalogues all security, performance, and code quality issues identified during Phase 0 baseline audit. Issues are prioritised by **severity** (CVSS-inspired) and **effort** (time to fix), mapped to **audit phases**, and include **OWASP/CWE references** where applicable.

**Total Issues:** 30
- 🔴 **Critical (P0):** 2
- 🟠 **High (P1):** 6
- 🟡 **Medium (P2):** 10
- 🟢 **Low (P3):** 12

**Phase Distribution:**
- Phase 1 (Security Surface): 5 issues
- Phase 2 (Auth & RLS): 4 issues
- Phase 3 (Data Fetching): 3 issues
- Phase 4 (TypeScript Strict): 5 issues
- Phase 5 (Performance): 4 issues
- Phase 6 (Reliability): 5 issues
- Phase 7 (Accessibility): 3 issues
- Phase 8 (Release Readiness): 1 issue

---

## Severity & Effort Matrix

### Severity Levels

| Level | CVSS Range | Description | Response Time |
|-------|------------|-------------|---------------|
| 🔴 **Critical (P0)** | 9.0-10.0 | Immediate data breach/unauthorised access risk | < 24 hours |
| 🟠 **High (P1)** | 7.0-8.9 | Significant security/performance degradation | < 1 week |
| 🟡 **Medium (P2)** | 4.0-6.9 | Moderate impact on security/UX/maintainability | < 1 month |
| 🟢 **Low (P3)** | 0.1-3.9 | Minor improvements, best practices | Backlog |

### Effort Levels

| Effort | Time Estimate | Description |
|--------|---------------|-------------|
| 🟢 **Low** | < 2 hours | Quick fix, isolated change |
| 🟡 **Medium** | 2-8 hours | Moderate refactoring, testing required |
| 🔴 **High** | > 8 hours | Major architectural change, extensive testing |

---

## Quick Wins Matrix

**Priority:** Issues with **High Severity + Low Effort** (fix first!)

| ID | Issue | Severity | Effort | Phase | Est. Time |
|----|-------|----------|--------|-------|-----------|
| SEC-001 | Admin users table readable by all | 🔴 Critical | 🟢 Low | 1 | 30 min |
| SEC-002 | Storage bucket path traversal | 🔴 Critical | 🟡 Medium | 1 | 2 hours |
| SEC-003 | No environment variable validation | 🟠 High | 🟢 Low | 1 | 30 min |
| REL-001 | No error boundaries | 🟠 High | 🟢 Low | 6 | 1 hour |
| PERF-004 | Hero image not optimised (WebP) | 🟡 Medium | 🟢 Low | 5 | 1 hour |

**Total Quick Wins Time:** ~5 hours → High impact!

---

## Critical Issues (P0) — IMMEDIATE ACTION REQUIRED

### 🔴 SEC-001: Admin User List Publicly Readable

**Severity:** Critical (CVSS 7.5)
**Effort:** Low (30 minutes)
**Phase:** 1 (Security Surface)

**Description:**
The `admin_users` table has a SELECT policy `USING (true)`, allowing **any authenticated user** to query the full list of admin user IDs.

**Location:**
- `supabase/migrations/20251031170000_apply_rls.sql:59`
- `supabase/migrations/20251031164000_create_admin_users.sql:16-18`

**Current Policy:**
```sql
CREATE POLICY "Admin list readable"
  ON public.admin_users FOR SELECT
  USING (true);
```

**Vulnerability:**
```sql
-- Any authenticated user can run:
SELECT user_id FROM public.admin_users;
-- Returns: ['uuid-1', 'uuid-2', 'uuid-3']
```

**Attack Scenario:**
1. Attacker creates account
2. Queries `admin_users` table → discovers admin UUIDs
3. Targets admins with social engineering, phishing, or account takeover attempts
4. Potential for privilege escalation if admin credentials compromised

**OWASP Mapping:**
- **A01:2021** — Broken Access Control
- **A04:2021** — Insecure Design (information disclosure)

**CWE Mapping:**
- **CWE-284:** Improper Access Control
- **CWE-359:** Exposure of Private Personal Information

**Impact:**
- 🔴 Security: Information disclosure
- 🟠 Privacy: Admin identities exposed
- 🟠 Social Engineering: Targeted attacks enabled

**Fix:**
```sql
-- Replace "Admin list readable" policy with:
DROP POLICY IF EXISTS "Admin list readable" ON public.admin_users;

CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);
```

**Verification:**
```typescript
// Negative test: Non-admin user should NOT see other admins
const { data, error } = await supabase
  .from('admin_users')
  .select('user_id');

console.assert(data === null || data.length === 0 || (data.length === 1 && data[0].user_id === currentUser.id));
```

**Rollback:**
```sql
-- Restore original policy if frontend breaks
CREATE POLICY "Admin list readable" ON public.admin_users FOR SELECT USING (true);
```

---

### 🔴 SEC-002: Storage Bucket Path Traversal Vulnerability

**Severity:** Critical (CVSS 8.2)
**Effort:** Medium (2 hours)
**Phase:** 1 (Security Surface)

**Description:**
Avatar upload policies allow authenticated users to upload files to **any path** in the `avatars` bucket, including other users' folders. No path validation enforced at database level.

**Location:**
- `supabase/migrations/20251031160000_add_avatars_bucket.sql:11-16`
- `src/lib/storage.ts:18-49` (client-side mitigation insufficient)

**Current Policy:**
```sql
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );
```

**Vulnerability:**
```typescript
// Attacker can upload to victim's folder:
await supabase.storage
  .from('avatars')
  .upload('victim-uuid/malicious.svg', file);
// ✅ Policy allows this!
```

**Attack Scenarios:**
1. **Overwrite victim's avatar:** Upload to `victim-uuid/avatar.jpg` → victim sees malicious image
2. **SVG XSS:** Upload `<svg onload="alert(document.cookie)">` → if rendered inline, executes JavaScript
3. **Phishing:** Upload official-looking image to impersonate victim
4. **DoS:** Upload large files to victim's quota

**OWASP Mapping:**
- **A01:2021** — Broken Access Control
- **A03:2021** — Injection (if SVG allowed)

**CWE Mapping:**
- **CWE-22:** Improper Limitation of a Pathname to a Restricted Directory (Path Traversal)
- **CWE-284:** Improper Access Control
- **CWE-79:** XSS (if SVG rendered inline)

**Impact:**
- 🔴 Security: Unauthorised file access/modification
- 🔴 Integrity: User data tampering
- 🟠 Availability: Storage quota abuse

**Fix (Part 1: RLS Policy):**
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_fix_avatars_policy.sql
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;

-- INSERT: Users can only upload to their own folder
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Users can only update their own files
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Users can only delete their own files
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Fix (Part 2: File Type Validation):**
```typescript
// src/lib/storage.ts — Add SVG block
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i; // Explicitly exclude SVG
```

**Verification:**
```typescript
// Negative test: Upload to another user's path should fail
const victimUserId = 'some-other-uuid';
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${victimUserId}/hack.jpg`, file);

console.assert(error !== null, 'Path traversal attack should be blocked');
```

**Rollback:**
If legitimate uploads fail, temporarily restore original policy and investigate path format issues.

---

## High Priority Issues (P1)

### 🟠 SEC-003: No Environment Variable Validation

**Severity:** High (CVSS 7.0)
**Effort:** Low (30 minutes)
**Phase:** 1 (Security Surface)

**Description:**
Required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are not validated at application startup. If missing, the app **silently fails** with cryptic runtime errors instead of clear error messages.

**Location:**
- `src/integrations/supabase/client.ts:5-6`

**Current Code:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { ... });
// ❌ No validation — fails silently if undefined
```

**Impact:**
- 🟠 Developer Experience: Confusing errors during setup
- 🟡 Security: May expose internal error messages to users

**OWASP Mapping:**
- **A05:2021** — Security Misconfiguration

**Fix:**
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing required environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file.'
  );
}

// Optional: URL format validation
try {
  new URL(SUPABASE_URL);
} catch {
  throw new Error('VITE_SUPABASE_URL must be a valid URL');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { ... });
```

**Verification:**
```bash
# Remove env vars and start dev server
unset VITE_SUPABASE_URL
npm run dev
# Expected: Clear error message, app doesn't start
```

---

### 🟠 PERF-001: Unbounded Database Queries (No Pagination)

**Severity:** High (CVSS 7.5)
**Effort:** High (16 hours)
**Phase:** 3 (Data Fetching & Pagination)

**Description:**
Most data fetching queries have **no pagination** (no `limit`, `offset`, or cursor). Queries load **all rows** from tables, causing performance degradation as data grows and potential DoS.

**Location:**
- `src/pages/Feed.tsx:93-106` — Loads all catches
- `src/pages/Profile.tsx` — Loads all user catches
- `src/components/Leaderboard.tsx:61` — `.limit(500)` on species (better, but still high)

**Current Code (Feed.tsx):**
```typescript
const { data, error } = await supabase
  .from("catches")
  .select(`*, profiles(*), ratings(*), comments(*), reactions(*)`)
  .order("created_at", { ascending: false });
  // ❌ No .limit() — loads ALL catches!
```

**Impact:**
- 🔴 Performance: Slow page loads (seconds → minutes as data grows)
- 🔴 Scalability: Database CPU/memory exhaustion
- 🟠 DoS Risk: Attacker creates 10,000 catches → app unusable
- 🟡 UX: Poor initial load time

**OWASP Mapping:**
- **A04:2021** — Insecure Design (unbounded resource consumption)

**CWE Mapping:**
- **CWE-770:** Allocation of Resources Without Limits or Throttling

**Fix (Cursor-based Pagination with React Query):**

**Step 1: Update queries to use keyset pagination**
```typescript
// src/pages/Feed.tsx
import { useInfiniteQuery } from '@tanstack/react-query';

const CATCHES_PER_PAGE = 20;

const fetchCatchesPage = async ({ pageParam = null }) => {
  let query = supabase
    .from("catches")
    .select(`*, profiles(*), ratings(*), comments(*), reactions(*)`)
    .order("created_at", { ascending: false })
    .limit(CATCHES_PER_PAGE);

  if (pageParam) {
    // Keyset pagination: continue from last created_at
    query = query.lt('created_at', pageParam);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    catches: data,
    nextCursor: data.length === CATCHES_PER_PAGE ? data[data.length - 1].created_at : null,
  };
};

const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
  queryKey: ['catches'],
  queryFn: fetchCatchesPage,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**Step 2: Add "Load More" button**
```tsx
{hasNextPage && (
  <Button onClick={() => fetchNextPage()}>
    Load More
  </Button>
)}
```

**Verification:**
1. Create 100 test catches
2. Verify only 20 load initially
3. Click "Load More" → next 20 load
4. Monitor network tab: each request should be ~20 rows, not 100

**Rollback:**
Revert to `.limit(100)` if infinite scroll breaks existing UX.

---

### 🟠 TS-001: TypeScript Strict Mode Disabled

**Severity:** High (CVSS 6.5)
**Effort:** High (24+ hours)
**Phase:** 4 (TypeScript Strict & Contracts)

**Description:**
TypeScript is **not in strict mode** (`noImplicitAny: false`, `strictNullChecks: false`), allowing implicit `any` types and null/undefined access without checks. This significantly reduces type safety and increases runtime error risk.

**Location:**
- `tsconfig.json:9-14`

**Current Config:**
```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Impact:**
- 🟠 Security: Type confusion bugs can lead to logic errors
- 🟠 Reliability: Null pointer exceptions at runtime
- 🟡 Maintainability: Reduced confidence in refactoring

**OWASP Mapping:**
- **A04:2021** — Insecure Design (lack of defensive coding)

**Fix (Multi-step approach):**

**Step 1: Enable strict mode incrementally**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Step 2: Fix build errors (expect 100+ errors initially)**
- Add explicit types to all function parameters
- Add null checks (`if (value === null) return;`)
- Replace `any` with proper types or `unknown`

**Step 3: Add Zod validation for external data**
```typescript
import { z } from 'zod';

const CatchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  user_id: z.string().uuid(),
  // ... all fields
});

// Validate Supabase responses
const { data } = await supabase.from('catches').select('*');
const validated = CatchSchema.array().parse(data);
```

**Verification:**
```bash
npm run build
# Expected: 0 TypeScript errors
```

**Rollback:**
```json
{ "strict": false } // Temporary — must fix eventually
```

**Estimated Effort:** 24-40 hours (high complexity across entire codebase)

---

### 🟠 REL-001: No Error Boundaries

**Severity:** High (CVSS 6.0)
**Effort:** Low (1 hour)
**Phase:** 6 (Reliability & Observability)

**Description:**
No React error boundaries implemented. Component errors cause **entire app to unmount**, showing blank screen to users with no recovery option.

**Impact:**
- 🟠 Availability: Single component error breaks entire app
- 🟡 UX: Poor error experience (blank screen)
- 🟡 Observability: No error reporting

**OWASP Mapping:**
- **A04:2021** — Insecure Design (lack of resilience)

**Fix:**

**Step 1: Create ErrorBoundary component**
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO Phase 6: Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-centre">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Wrap routes**
```typescript
// src/App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ... routes ... */}
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

**Verification:**
```typescript
// Create test component that throws
const BrokenComponent = () => {
  throw new Error('Test error');
};

// Add to route temporarily, verify error boundary catches it
```

---

### 🟠 PERF-002: Large Bundle Size (Main Chunk 584 KB)

**Severity:** High (CVSS 6.0)
**Effort:** Medium (8 hours)
**Phase:** 5 (Performance & DX)

**Description:**
Main JavaScript bundle is **584 KB uncompressed** (~182 KB gzipped), exceeding recommended 100 KB limit. Causes slow initial load on mobile/3G networks.

**Location:**
- `dist/assets/index-ZvxODzII.js` (584 KB)
- `dist/assets/Insights-CxhSOx-6.js` (433 KB) — Chart libraries

**Impact:**
- 🟠 Performance: 3-4s parse/execute on mobile
- 🟡 UX: Slow Time to Interactive (TTI)
- 🟡 SEO: Google penalises slow sites

**Fix:**

**Step 1: Manual chunk splitting**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', /* ... */],
          'vendor-charts': ['@nivo/bar', '@nivo/line', 'recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

**Step 2: Lazy-load chart libraries**
```typescript
// src/pages/Insights.tsx
const BarChart = lazy(() => import('@/components/charts/BarChart'));
const LineChart = lazy(() => import('@/components/charts/LineChart'));
```

**Verification:**
```bash
npm run build
# Check bundle sizes — main chunk should be < 300 KB
```

**Target:**
- Main chunk: < 300 KB uncompressed (~100 KB gzipped)
- Chart vendor chunk: Separate, lazy-loaded

---

## Medium Priority Issues (P2)

### 🟡 SEC-004: No CSP Violation Reporting

**Severity:** Medium (CVSS 5.5)
**Effort:** Low (1 hour)
**Phase:** 1 (Security Surface)

**Description:**
Content Security Policy configured but has no `report-uri` or `report-to` directive. CSP violations are silently ignored instead of logged for security monitoring.

**Location:**
- `vercel.json:9-10`

**Fix:**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; ...; report-uri /api/csp-report; report-to csp-endpoint"
}
```

Add report handler (Vercel Edge Function or Supabase Edge Function).

---

### 🟡 SEC-005: No Input Validation with Zod

**Severity:** Medium (CVSS 5.0)
**Effort:** Medium (6 hours)
**Phase:** 2 (Auth & Supabase Policies) + 4 (TypeScript Strict)

**Description:**
Zod is installed but **not used** for validating user inputs or API responses. Forms rely on client-side HTML validation only.

**Location:**
- All form components (`AddCatch.tsx`, `ProfileSettings.tsx`, etc.)

**Impact:**
- 🟡 Security: Malformed data may bypass validation
- 🟡 Reliability: Runtime errors from unexpected data shapes

**Fix:**
```typescript
// Example: AddCatch form
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const catchSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  species: z.enum(['carp', 'pike', 'perch', /* ... */]),
  weight: z.number().positive().optional(),
  // ... all fields
});

const form = useForm({
  resolver: zodResolver(catchSchema),
});
```

---

### 🟡 SEC-006: Broad img-src CSP Directive

**Severity:** Medium (CVSS 4.5)
**Effort:** Low (30 minutes)
**Phase:** 1 (Security Surface)

**Description:**
CSP allows `img-src https:` (any HTTPS image). Should restrict to known domains only.

**Fix:**
```
img-src 'self' https://*.supabase.co https://*.supabase.in data: blob:
```
(Remove `https:`)

---

### 🟡 PERF-003: No Bundle Analyser

**Severity:** Medium (CVSS 4.0)
**Effort:** Low (30 minutes)
**Phase:** 5 (Performance)

**Fix:**
```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true }),
  ],
});
```

---

### 🟡 REL-002: No Structured Logging

**Severity:** Medium (CVSS 4.0)
**Effort:** Medium (4 hours)
**Phase:** 6 (Reliability & Observability)

**Fix:**
Replace `console.error()` with structured logger (Pino, Winston) and add correlation IDs.

---

### 🟡 REL-003: No Error Tracking Service

**Severity:** Medium (CVSS 4.5)
**Effort:** Low (2 hours)
**Phase:** 6 (Reliability & Observability)

**Fix:**
Integrate Sentry or LogRocket for production error monitoring.

---

### 🟡 TEST-001: Minimal Test Coverage

**Severity:** Medium (CVSS 4.0)
**Effort:** High (40+ hours)
**Phase:** 2 (Auth & Supabase Policies) + 6 (Reliability)

**Description:**
Only 4 test files exist. No integration tests, E2E tests, or negative auth tests.

**Fix:**
- Add Playwright for E2E
- Write negative tests for RLS policies (unauthorised access)
- Add unit tests for critical business logic

---

### 🟡 PERF-004: Hero Image Not Optimised

**Severity:** Medium (CVSS 3.5)
**Effort:** Low (1 hour)
**Phase:** 5 (Performance)

**Description:**
`hero-fish.jpg` is 136 KB JPEG. Should convert to WebP with `srcset` for responsive images.

**Fix:**
```bash
# Convert to WebP
cwebp -q 80 hero-fish.jpg -o hero-fish.webp
cwebp -q 80 -resize 800 0 hero-fish.jpg -o hero-fish-800w.webp
cwebp -q 80 -resize 400 0 hero-fish.jpg -o hero-fish-400w.webp
```

```tsx
<picture>
  <source srcset="/hero-fish-400w.webp 400w, /hero-fish-800w.webp 800w, /hero-fish.webp 1200w" type="image/webp" />
  <img src="/hero-fish.jpg" alt="Hero fish" loading="eager" />
</picture>
```

---

### 🟡 DX-001: No .env.example File

**Severity:** Medium (CVSS 3.0)
**Effort:** Low (10 minutes)
**Phase:** 1 (Security Surface)

**Fix:**
```bash
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_PUBLIC_SITE_URL=http://localhost:8080
```

---

### 🟡 DX-002: No CI/CD Pipeline

**Severity:** Medium (CVSS 3.5)
**Effort:** Medium (4 hours)
**Phase:** 8 (Release Readiness)

**Fix:**
Add GitHub Actions workflow with:
- Lint, test, build
- Security scanning (npm audit, Snyk)
- Lighthouse CI

---

## Low Priority Issues (P3)

### 🟢 A11Y-001: Missing ARIA Labels
**Severity:** Low | **Effort:** Medium | **Phase:** 7

Forms and interactive elements may be missing proper ARIA labels. Requires audit.

---

### 🟢 A11Y-002: Colour Contrast Check
**Severity:** Low | **Effort:** Low | **Phase:** 7

Run axe DevTools or Lighthouse to verify WCAG AA contrast ratios.

---

### 🟢 A11Y-003: Focus Management
**Severity:** Low | **Effort:** Low | **Phase:** 7

Ensure focus moves correctly in modals/dialogs. Test keyboard navigation.

---

### 🟢 PERF-005: No HTTP/2 Server Push
**Severity:** Low | **Effort:** N/A | **Phase:** 5

Vercel enables HTTP/2 by default. No action needed.

---

### 🟢 PERF-006: No Service Worker (PWA)
**Severity:** Low | **Effort:** High | **Phase:** 5

Consider adding Workbox for offline support (optional).

---

### 🟢 DX-003: No Pre-commit Hooks
**Severity:** Low | **Effort:** Low | **Phase:** 8

Add Husky + lint-staged for automatic linting/formatting.

---

### 🟢 DX-004: No CHANGELOG.md
**Severity:** Low | **Effort:** Low | **Phase:** 8

Add changelog for version tracking.

---

### 🟢 SEC-007: No Rate Limiting (Client-side)
**Severity:** Low | **Effort:** Low | **Phase:** 2

Add client-side rate limiting for API calls (Supabase RLS handles server-side).

---

### 🟢 SEC-008: No Subresource Integrity (SRI)
**Severity:** Low | **Effort:** Medium | **Phase:** 1

External fonts/scripts should use SRI hashes (if any CDN resources used).

---

### 🟢 UX-001: No Loading Skeletons
**Severity:** Low | **Effort:** Medium | **Phase:** 6

Replace spinner with skeleton screens for better perceived performance.

---

### 🟢 UX-002: Inconsistent Empty States
**Severity:** Low | **Effort:** Low | **Phase:** 7

Audit empty states across pages for consistency.

---

### 🟢 UX-003: No Offline Indicator
**Severity:** Low | **Effort:** Low | **Phase:** 6

Show toast/banner when user goes offline.

---

## Phase Roadmap

### Phase 1: Security Surface (Headers, CORS, Secrets)
**Effort:** 6 hours | **Issues:** 5 (2 critical, 3 medium)

**Deliverables:**
1. ✅ Fix admin_users RLS policy (SEC-001)
2. ✅ Fix storage bucket path traversal (SEC-002)
3. ✅ Add env variable validation (SEC-003)
4. ✅ Add .env.example (DX-001)
5. ✅ Restrict img-src CSP (SEC-006)
6. ✅ Add CSP violation reporting (SEC-004)
7. ✅ Verify headers in production (curl test)

---

### Phase 2: Auth & Supabase Policies
**Effort:** 12 hours | **Issues:** 4 (0 critical, 1 high, 3 medium)

**Deliverables:**
1. ✅ Add negative tests for RLS policies (unauthorised access)
2. ✅ Add negative tests for admin routes
3. ✅ Add Zod validation to forms (SEC-005)
4. ✅ Add input sanitisation tests

---

### Phase 3: Data Fetching & Pagination
**Effort:** 16 hours | **Issues:** 3 (0 critical, 1 high, 2 medium)

**Deliverables:**
1. ✅ Implement keyset pagination (PERF-001)
2. ✅ Add useInfiniteQuery to Feed, Profile, Leaderboard
3. ✅ Add empty/error/end states
4. ✅ Test concurrent inserts (no dupes/skips)

---

### Phase 4: TypeScript Strict & Contracts
**Effort:** 32 hours | **Issues:** 5 (0 critical, 1 high, 4 medium)

**Deliverables:**
1. ✅ Enable strict mode (TS-001)
2. ✅ Fix all type errors
3. ✅ Add Zod validation for API responses (SEC-005)
4. ✅ Remove `any` types
5. ✅ Add generated Supabase types verification

---

### Phase 5: Performance & DX
**Effort:** 14 hours | **Issues:** 4 (0 critical, 1 high, 3 medium)

**Deliverables:**
1. ✅ Bundle splitting (PERF-002)
2. ✅ Image optimisation (PERF-004)
3. ✅ Add bundle analyser (PERF-003)
4. ✅ Lighthouse audit
5. ✅ Compare before/after metrics

---

### Phase 6: Reliability & Observability
**Effort:** 10 hours | **Issues:** 5 (0 critical, 1 high, 4 medium)

**Deliverables:**
1. ✅ Add error boundaries (REL-001)
2. ✅ Add structured logging (REL-002)
3. ✅ Integrate error tracking (REL-003)
4. ✅ Add correlation IDs
5. ✅ Add loading skeletons (UX-001)

---

### Phase 7: Accessibility & UX Paper Cuts
**Effort:** 8 hours | **Issues:** 3 (0 critical, 0 high, 3 low)

**Deliverables:**
1. ✅ ARIA label audit (A11Y-001)
2. ✅ Colour contrast check (A11Y-002)
3. ✅ Focus management (A11Y-003)
4. ✅ Consistent empty states (UX-002)

---

### Phase 8: Release Readiness
**Effort:** 6 hours | **Issues:** 1 (0 critical, 0 high, 1 medium)

**Deliverables:**
1. ✅ Add CI/CD pipeline (DX-002)
2. ✅ Add pre-commit hooks (DX-003)
3. ✅ Production readiness checklist
4. ✅ Rollback plan
5. ✅ Smoke tests

---

## Total Effort Estimate

| Phase | Effort | Critical | High | Medium | Low |
|-------|--------|----------|------|--------|-----|
| Phase 1 | 6h | 2 | 0 | 3 | 0 |
| Phase 2 | 12h | 0 | 0 | 4 | 0 |
| Phase 3 | 16h | 0 | 1 | 2 | 0 |
| Phase 4 | 32h | 0 | 1 | 4 | 0 |
| Phase 5 | 14h | 0 | 1 | 3 | 0 |
| Phase 6 | 10h | 0 | 1 | 4 | 0 |
| Phase 7 | 8h | 0 | 0 | 0 | 3 |
| Phase 8 | 6h | 0 | 0 | 1 | 0 |
| **Total** | **104h** | **2** | **6** | **10** | **12** |

**Timeline:** ~13 working days (8h/day) for one engineer

---

## Immediate Next Steps (Phase 1 Kickoff)

1. ✅ **Create branch:** `git checkout -b phase-1-security-surface`
2. ✅ **Fix SEC-001** (30 min): Update admin_users RLS policy
3. ✅ **Fix SEC-002** (2 hours): Add storage bucket path validation
4. ✅ **Fix SEC-003** (30 min): Add env variable validation
5. ✅ **Add .env.example** (10 min)
6. ✅ **Test & commit** (1 hour): Negative tests, verification
7. ✅ **Create Phase 1 report** in `docs/phase-1-report.md`
8. ✅ **Commit & push**
9. ✅ **Propose Phase 2 plan**

**Total Phase 1 Time:** ~6 hours

---

**End of Risk Register**
**Next:** Begin Phase 1 implementation
