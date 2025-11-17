# Phase 2: Authentication & Validation - Security Audit Plan

**Project:** ReelyRated Web Application
**Phase:** 2 - Authentication & Supabase Policies
**Estimated Effort:** 12 hours
**Issues:** 4 (0 critical, 0 high, 4 medium)
**Start Date:** 2025-11-12

---

## Executive Summary

Phase 2 focuses on **authentication hardening** and **input validation**. While Phase 1 fixed RLS policies, Phase 2 ensures they're properly tested and adds validation layers to prevent malformed data from reaching the database.

**Key Goals:**
1. Add comprehensive negative tests for RLS policies
2. Implement Zod validation for all user inputs
3. Add input sanitisation tests
4. Optional: Client-side rate limiting

---

## Issues to Address

### 🟡 SEC-005: No Input Validation with Zod
**Severity:** Medium (CVSS 5.0)
**Effort:** 6 hours
**Priority:** High (P1)

**Problem:**
Zod is installed (`package.json`) but **not used** anywhere. Forms rely only on client-side HTML validation, which can be bypassed.

**Location:**
- `src/pages/AddCatch.tsx` - Catch submission form
- `src/components/ProfileSettings.tsx` - Profile editing
- All other form components

**Impact:**
- 🟡 Security: Malformed data may bypass validation
- 🟡 Reliability: Runtime errors from unexpected data shapes
- 🟡 UX: Poor error messages

**Fix Strategy:**
1. Create Zod schemas for all form data structures
2. Integrate with React Hook Form using `zodResolver`
3. Add client-side validation with clear error messages
4. TypeScript types derived from Zod schemas (single source of truth)

**Example:**
```typescript
// src/schemas/catch.ts
import { z } from 'zod';

export const catchSchema = z.object({
  title: z.string().min(1, 'Title required').max(200, 'Title too long'),
  species: z.string().min(1, 'Species required'),
  weight: z.number().positive('Weight must be positive').optional(),
  length: z.number().positive('Length must be positive').optional(),
  location: z.string().min(1, 'Location required'),
  venue_id: z.string().uuid('Invalid venue').optional(),
  caught_at: z.string().datetime('Invalid date'),
});

export type CatchFormData = z.infer<typeof catchSchema>;
```

**Testing:**
- Valid inputs pass validation
- Invalid inputs show clear error messages
- Type safety verified with TypeScript

---

### 🟡 TEST-001: Minimal Test Coverage (Phase 2 Portion)
**Severity:** Medium (CVSS 4.0)
**Effort:** 4 hours (Phase 2 portion of 40+ total)
**Priority:** High (P1)

**Problem:**
Only 4 test files exist. **No negative tests** for authentication or RLS policies.

**Phase 2 Focus:**
Add negative tests specifically for:
1. **RLS Policy Tests** - Verify unauthorised access is blocked
2. **Admin Route Tests** - Verify non-admins can't access admin pages

**Test Cases to Add:**

#### RLS Policy Negative Tests
```typescript
// Test: Non-admin can't query admin_users
test('non-admin cannot list admin users', async () => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id');

  expect(data).toEqual([]); // Can only see own record (if admin)
  expect(error).toBeNull();
});

// Test: User can't upload to other user's folder
test('user cannot upload to another user folder', async () => {
  const fakeUserId = '00000000-0000-0000-0000-000000000000';
  const file = new File(['test'], 'test.jpg');

  const { error } = await supabase.storage
    .from('avatars')
    .upload(`${fakeUserId}/test.jpg`, file);

  expect(error).not.toBeNull();
  expect(error?.message).toContain('row-level security');
});

// Test: User can't read other user's catches (if private)
// Test: User can't update other user's profile
// Test: User can't delete other user's catches
```

#### Admin Route Tests
```typescript
// Test: Non-admin redirected from admin pages
test('non-admin redirected from /admin', async () => {
  // Mock non-admin user
  const { rerender } = render(<AdminReports />);

  await waitFor(() => {
    expect(screen.queryByText('Admin Reports')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

// Test: Unauthenticated user redirected from admin pages
// Test: Admin can access admin pages
```

**Testing Approach:**
- Use Vitest + React Testing Library
- Create test utilities for auth mocking
- Focus on negative cases (unauthorised access)
- Run tests in CI/CD pipeline

---

### 🟡 SEC-007: No Client-Side Rate Limiting
**Severity:** Low (CVSS 2.5)
**Effort:** 2 hours
**Priority:** Medium (P2)

**Problem:**
No client-side rate limiting for API calls. While Supabase RLS handles server-side protection, client-side limits improve UX and reduce unnecessary requests.

**Use Cases:**
- Search input (debounce + rate limit)
- Form submissions (prevent double-submit)
- File uploads (queue management)

**Fix Strategy:**
```typescript
// src/lib/rate-limit.ts
import { useRef } from 'react';

export function useRateLimit(limit: number, window: number) {
  const requests = useRef<number[]>([]);

  return {
    canProceed: () => {
      const now = Date.now();
      requests.current = requests.current.filter(t => now - t < window);

      if (requests.current.length >= limit) {
        return false;
      }

      requests.current.push(now);
      return true;
    },
    reset: () => {
      requests.current = [];
    },
  };
}

// Usage in components
const rateLimit = useRateLimit(5, 60000); // 5 requests per minute

const handleSubmit = async () => {
  if (!rateLimit.canProceed()) {
    toast.error('Too many requests. Please wait.');
    return;
  }

  // Proceed with submission
};
```

**Priority:** Low - Nice to have, not critical for security

---

## Deliverables

| # | Deliverable | Effort | Priority |
|---|-------------|--------|----------|
| 1 | Create Zod schemas for all forms | 2h | High |
| 2 | Integrate Zod with React Hook Form | 2h | High |
| 3 | Add form validation error handling | 1h | High |
| 4 | Test Zod validation (all forms) | 1h | High |
| 5 | Create RLS negative test suite | 2h | High |
| 6 | Create admin route negative tests | 1h | High |
| 7 | Add test utilities for auth mocking | 1h | High |
| 8 | (Optional) Implement rate limiting | 2h | Medium |
| **Total** | | **12h** | |

---

## Forms Requiring Validation

Based on codebase analysis:

| Form | Component | Fields | Priority |
|------|-----------|--------|----------|
| **Add Catch** | `AddCatch.tsx` | title, species, weight, length, location, venue_id, caught_at, notes, photo | **Critical** |
| **Profile Settings** | `ProfileSettings.tsx` | username, full_name, bio, location, avatar | **High** |
| **Search** | `Search.tsx` | query, filters | Medium |
| **Login/Signup** | Auth components | email, password, username | **Critical** (if custom forms) |

**Note:** If using Supabase Auth UI components, those have built-in validation.

---

## Testing Strategy

### Test Structure
```
src/
├── __tests__/
│   ├── rls/
│   │   ├── admin-users.test.ts      # SEC-001 tests
│   │   ├── storage.test.ts          # SEC-002 tests
│   │   ├── catches.test.ts          # Catch RLS tests
│   │   └── profiles.test.ts         # Profile RLS tests
│   ├── auth/
│   │   ├── admin-routes.test.tsx    # Admin auth tests
│   │   └── protected-routes.test.tsx # General auth tests
│   └── validation/
│       ├── catch-schema.test.ts     # Zod schema tests
│       └── profile-schema.test.ts   # Zod schema tests
└── test-utils/
    ├── auth-mock.ts                  # Auth mocking utilities
    └── supabase-mock.ts              # Supabase mocking utilities
```

### Test Coverage Goals
- **RLS Policies:** 100% negative test coverage
- **Admin Routes:** 100% unauthorised access test coverage
- **Zod Schemas:** 100% validation rule coverage
- **Form Validation:** All forms have integration tests

---

## Implementation Order

### Week 1: Zod Validation (6 hours)

**Day 1: Setup & Critical Forms (3h)**
1. Create `src/schemas/` directory
2. Implement `catchSchema` for AddCatch form
3. Implement `profileSchema` for ProfileSettings
4. Integrate zodResolver with React Hook Form

**Day 2: Testing & Refinement (3h)**
5. Test validation on AddCatch form
6. Test validation on ProfileSettings form
7. Add error message styling
8. Document validation patterns

### Week 2: Negative Tests (6 hours)

**Day 3: RLS Tests (3h)**
1. Set up test infrastructure
2. Write RLS negative tests (admin_users, storage, catches)
3. Create Supabase test utilities

**Day 4: Auth Tests (2h)**
4. Write admin route tests
5. Write protected route tests
6. Add auth mocking utilities

**Day 5: Optional (1h)**
7. (Optional) Implement rate limiting if time allows

---

## Success Criteria

### Zod Validation (SEC-005)
- [x] All critical forms use Zod schemas
- [x] React Hook Form integrated with zodResolver
- [x] Error messages display correctly
- [x] TypeScript types derived from schemas
- [x] No HTML-only validation remaining on critical forms

### Negative Tests (TEST-001)
- [x] All RLS policies have negative tests
- [x] All admin routes have unauthorised access tests
- [x] Test suite runs in CI/CD
- [x] 100% of tests pass
- [x] Test utilities documented for future tests

### Rate Limiting (SEC-007) - Optional
- [ ] Rate limit hook implemented
- [ ] Applied to search and forms
- [ ] User-friendly error messages

---

## Security Impact

### Before Phase 2
- ❌ Forms accept malformed data (client-side only validation)
- ❌ No verification that RLS policies actually block unauthorised access
- ❌ No tests for admin authentication checks
- ❌ No rate limiting (unnecessary API calls)

### After Phase 2
- ✅ Zod validates all inputs with TypeScript type safety
- ✅ Comprehensive negative test suite verifies RLS policies
- ✅ Admin routes tested for unauthorised access
- ✅ Clear error messages guide users to fix input issues
- ✅ (Optional) Rate limiting prevents abuse

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Zod schemas too strict** | Users can't submit valid forms | Use `.optional()` liberally, test with real data |
| **Tests depend on live Supabase** | Tests fail if DB unavailable | Mock Supabase client for unit tests |
| **Breaking changes to forms** | UX regression | Test forms manually after Zod integration |
| **Time overrun** | Phase takes longer than 12h | Rate limiting is optional, can defer to Phase 6 |

---

## Rollback Plan

If Zod integration causes issues:

```typescript
// Temporarily disable Zod resolver
const form = useForm({
  // resolver: zodResolver(catchSchema), // Commented out
});
```

Then investigate:
- Which validation rules are too strict?
- Are error messages clear to users?
- Is TypeScript integration working correctly?

---

## Dependencies

### npm Packages (Already Installed)
- ✅ `zod` - Schema validation
- ✅ `react-hook-form` - Form state management
- ✅ `@hookform/resolvers` - Zod integration
- ✅ `vitest` - Testing framework
- ✅ `@testing-library/react` - React testing utilities

### New Packages Needed
- `@supabase/supabase-js` testing utilities (if not already available)

---

## Documentation

### Files to Create
1. `src/schemas/README.md` - Zod schema documentation
2. `src/__tests__/README.md` - Testing documentation
3. `docs/phase-2-test-evidence.md` - Test results
4. `docs/phase-2-completion-report.md` - Final report

### Files to Update
1. `README.md` - Add validation documentation
2. `docs/setup.md` - Update with testing instructions

---

## Next Steps After Phase 2

**Phase 3: Data Fetching & Pagination** (16 hours)
- Implement pagination (PERF-001) - Already identified in Phase 1 UX findings
- Add infinite scroll to Feed, Profile, Leaderboard
- Fix pagination issues found in manual testing

---

## Approvals

**Phase 2 Plan Status:** ✅ Ready for execution

**Estimated Timeline:**
- Start: 2025-11-12
- End: 2025-11-14 (2-3 days)
- Total: 12 hours

**Next:** Begin with Zod validation implementation

---

## Questions for User

Before starting Phase 2:

1. **Authentication:** Are you using Supabase Auth UI or custom forms?
   - If custom: Need to add validation there too
   - If Supabase UI: Can skip login/signup validation

2. **Testing Priority:** Should we prioritize:
   - Option A: Zod validation first (user-facing improvement)
   - Option B: Negative tests first (security verification)
   - Recommendation: Zod first (6h), tests second (6h)

3. **Rate Limiting:** Include in Phase 2 or defer?
   - Low priority, can defer to later phase
   - Recommendation: Defer unless specifically needed

4. **Test Coverage:** Target coverage percentage?
   - Recommendation: 100% for RLS/auth, not aiming for overall % yet
