# SEC-001 Test Plan: Admin Users RLS Policy

**Issue:** Admin users table readable by all authenticated users (CVSS 7.5)
**Fix:** Restrict SELECT policy to own user_id only
**Migration:** `supabase/migrations/20251112092639_fix_admin_users_policy.sql`

---

## Test Environment Setup

### Prerequisites
- Supabase project with migrations applied
- Two test accounts:
  - Account A: Regular user (non-admin)
  - Account B: Admin user (in admin_users table)

---

## Test Cases

### ✅ Test 1: Admin user can check own status

**Setup:**
- Log in as Account B (admin user)

**Test:**
```sql
SELECT * FROM public.admin_users WHERE user_id = auth.uid();
```

**Expected Result:**
```
user_id                               | created_at
--------------------------------------|-------------------------
<account-b-uuid>                      | 2025-11-12 09:00:00+00
```

**Status:** Should return 1 row ✅

---

### ✅ Test 2: Non-admin user gets empty result

**Setup:**
- Log in as Account A (non-admin user)

**Test:**
```sql
SELECT * FROM public.admin_users WHERE user_id = auth.uid();
```

**Expected Result:**
```
(Empty result set)
```

**Status:** Should return 0 rows ✅

---

### 🔒 Test 3: Non-admin CANNOT query full admin list (CRITICAL)

**Setup:**
- Log in as Account A (non-admin user)

**Test:**
```sql
SELECT * FROM public.admin_users;
```

**Expected Result:**
```
(Empty result set)
```

**Status:** Should return 0 rows (RLS blocks access) ✅

**This is the KEY test** - previously this would return all admin user IDs!

---

### 🔒 Test 4: Non-admin CANNOT check if another user is admin

**Setup:**
- Log in as Account A (non-admin user)
- Get Account B's UUID

**Test:**
```sql
SELECT * FROM public.admin_users WHERE user_id = '<account-b-uuid>';
```

**Expected Result:**
```
(Empty result set)
```

**Status:** Should return 0 rows (RLS blocks access to other users) ✅

---

### ✅ Test 5: Frontend isAdminUser() still works

**Setup:**
- Log in as Account B (admin user)

**Test:**
```typescript
import { isAdminUser } from '@/lib/admin';

const result = await isAdminUser(user.id); // Check own admin status
console.log('Is admin?', result);
```

**Expected Result:**
```
Is admin? true
```

**Status:** Should return true for admin checking their own status ✅

---

### ✅ Test 6: Frontend isAdminUser() returns false for non-admin

**Setup:**
- Log in as Account A (non-admin user)

**Test:**
```typescript
import { isAdminUser } from '@/lib/admin';

const result = await isAdminUser(user.id);
console.log('Is admin?', result);
```

**Expected Result:**
```
Is admin? false
```

**Status:** Should return false ✅

---

## JavaScript Console Tests (Browser DevTools)

### Test in Browser (after deploying migration):

```javascript
// Run this in browser console while logged in

// Test 1: Check own admin status (should work)
const { data: ownCheck } = await window.supabase
  .from('admin_users')
  .select('user_id')
  .eq('user_id', (await window.supabase.auth.getUser()).data.user.id)
  .maybeSingle();
console.log('Own admin check:', ownCheck);
// Admin: should see { user_id: "..." }
// Non-admin: should see null

// Test 2: Try to query all admins (should fail for non-admins)
const { data: allAdmins } = await window.supabase
  .from('admin_users')
  .select('user_id');
console.log('All admins query:', allAdmins);
// Admin: should see [{ user_id: "..." }] (only own record)
// Non-admin: should see [] (empty array)

// Test 3: Try to check if another user is admin (should fail)
const { data: otherUserCheck } = await window.supabase
  .from('admin_users')
  .select('user_id')
  .eq('user_id', 'some-other-uuid');
console.log('Other user check:', otherUserCheck);
// Should see [] (empty array) for both admin and non-admin
```

---

## Expected Behaviour Summary

| User Type | Query | Before Fix | After Fix |
|-----------|-------|------------|-----------|
| Non-admin | `SELECT *` | ❌ Returns all admins | ✅ Returns empty |
| Non-admin | `WHERE user_id = <self>` | ✅ Returns empty | ✅ Returns empty |
| Non-admin | `WHERE user_id = <other>` | ❌ Returns admin if match | ✅ Returns empty |
| Admin | `SELECT *` | ❌ Returns all admins | ✅ Returns only self |
| Admin | `WHERE user_id = <self>` | ✅ Returns self | ✅ Returns self |
| Admin | `WHERE user_id = <other>` | ❌ Returns other admin | ✅ Returns empty |

---

## Known Issues (Pre-existing, not caused by this fix)

### 🐛 Async/Await Bugs in Frontend

**Files:**
- `src/pages/ProfileSettings.tsx:254` - Calls `isAdminUser()` without await
- `src/components/Navbar.tsx:185` - Calls `isAdminUser()` without await

**Impact:**
These return `Promise<boolean>` instead of `boolean`, so the values are always truthy. These components should use `isAdminUserSync()` instead.

**Action:**
Track as separate issue (not blocking this RLS fix). These bugs exist regardless of the RLS policy.

---

## Rollback Procedure

If the migration causes issues:

```sql
-- Drop the new restricted policy
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;

-- Restore the old permissive policy (INSECURE - temporary only)
CREATE POLICY "Admin list readable"
  ON public.admin_users FOR SELECT
  USING (true);
```

Then investigate what functionality requires reading the full admin list.

---

## Security Validation

### ✅ Prevents Information Disclosure
- Non-admin users can no longer enumerate admin accounts
- Reduces attack surface for targeted attacks

### ✅ Maintains Functionality
- Users can still check their own admin status
- `isAdminUser(currentUser.id)` continues to work
- Admin UI features still function correctly

### ✅ Defence in Depth
- Even if client-side checks are bypassed, RLS enforces access control
- Database-level protection (cannot be circumvented by modifying JavaScript)

---

## Sign-off

- [ ] All 6 test cases pass
- [ ] Browser console tests verified
- [ ] No regression in admin UI functionality
- [ ] No regression in non-admin user experience
- [ ] Migration applied to production
- [ ] Verified in production with curl/browser tests

**Tested by:** _________________
**Date:** _________________
**Sign-off:** _________________
