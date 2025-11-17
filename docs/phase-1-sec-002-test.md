# SEC-002 Test Plan: Storage Bucket Path Traversal

**Issue:** Users can upload avatars to any path in the bucket (CVSS 8.2)
**Fix:** Enforce path restrictions using RLS policies with `storage.foldername()`
**Migration:** `supabase/migrations/20251112111211_fix_storage_path_traversal.sql`

---

## Test Environment Setup

### Prerequisites
- Supabase project with migrations applied
- Two test user accounts:
  - User A: Regular user (non-admin)
  - User B: Different regular user
- Test image file (< 5MB, JPEG/PNG/GIF)

---

## Test Cases

### ✅ Test 1: User can upload to own folder

**Setup:**
- Log in as User A
- Get User A's UUID: `user-a-uuid`

**Test (via Supabase client):**
```typescript
const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userA.id}/avatar-${Date.now()}.jpg`, file);

console.log('Upload result:', { data, error });
```

**Expected Result:**
```json
{
  "data": {
    "path": "user-a-uuid/avatar-1234567890.jpg"
  },
  "error": null
}
```

**Status:** ✅ Upload should succeed

---

### 🔒 Test 2: User CANNOT upload to another user's folder (CRITICAL)

**Setup:**
- Log in as User A
- Get User B's UUID: `user-b-uuid`

**Test:**
```typescript
const file = new File(['malicious'], 'hack.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userB.id}/hack.jpg`, file);

console.log('Upload result:', { data, error });
```

**Expected Result:**
```json
{
  "data": null,
  "error": {
    "message": "new row violates row-level security policy",
    "statusCode": "42501"
  }
}
```

**Status:** ✅ Upload should FAIL with RLS policy violation

**This is the KEY test** - previously this would succeed!

---

### 🔒 Test 3: User CANNOT upload to root of bucket

**Setup:**
- Log in as User A

**Test:**
```typescript
const file = new File(['test'], 'malicious.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('malicious.jpg', file); // No folder, just filename

console.log('Upload result:', { data, error });
```

**Expected Result:**
```json
{
  "data": null,
  "error": {
    "message": "new row violates row-level security policy",
    "statusCode": "42501"
  }
}
```

**Status:** ✅ Upload should FAIL (no folder = no match with user ID)

---

### ✅ Test 4: User can update own files

**Setup:**
- Log in as User A
- Upload a file first (Test 1)
- Note the file path

**Test:**
```typescript
const file = new File(['updated'], 'avatar.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .update(`${userA.id}/existing-avatar.jpg`, file);

console.log('Update result:', { data, error });
```

**Expected Result:**
```json
{
  "data": {
    "path": "user-a-uuid/existing-avatar.jpg"
  },
  "error": null
}
```

**Status:** ✅ Update should succeed

---

### 🔒 Test 5: User CANNOT update another user's files

**Setup:**
- Log in as User A
- User B has an existing file: `user-b-uuid/avatar.jpg`

**Test:**
```typescript
const file = new File(['malicious'], 'avatar.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .update(`${userB.id}/avatar.jpg`, file);

console.log('Update result:', { data, error });
```

**Expected Result:**
```json
{
  "data": null,
  "error": {
    "message": "new row violates row-level security policy"
  }
}
```

**Status:** ✅ Update should FAIL

---

### ✅ Test 6: User can delete own files

**Setup:**
- Log in as User A
- User A has an existing file

**Test:**
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .remove([`${userA.id}/avatar-to-delete.jpg`]);

console.log('Delete result:', { data, error });
```

**Expected Result:**
```json
{
  "data": [
    {
      "name": "avatar-to-delete.jpg"
    }
  ],
  "error": null
}
```

**Status:** ✅ Delete should succeed

---

### 🔒 Test 7: User CANNOT delete another user's files

**Setup:**
- Log in as User A
- User B has a file: `user-b-uuid/avatar.jpg`

**Test:**
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .remove([`${userB.id}/avatar.jpg`]);

console.log('Delete result:', { data, error });
```

**Expected Result:**
```json
{
  "data": null,
  "error": {
    "message": "new row violates row-level security policy"
  }
}
```

**Status:** ✅ Delete should FAIL

---

### ✅ Test 8: Frontend upload via uploadAvatarToStorage() still works

**Setup:**
- Log in as User A
- Use the app's profile settings page

**Test:**
```typescript
import { uploadAvatarToStorage } from '@/lib/storage';

const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
const result = await uploadAvatarToStorage(userA.id, file);

console.log('Upload result:', result);
```

**Expected Result:**
```json
{
  "path": "avatars/user-a-uuid/1699876543210-abc123.jpg",
  "error": undefined
}
```

**Status:** ✅ Frontend upload should work normally

---

## Browser Console Tests

### Test in Browser DevTools (after deploying migration):

```javascript
// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user.id);

// Test 1: Upload to own folder (should work)
const file1 = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const result1 = await supabase.storage
  .from('avatars')
  .upload(`${user.id}/test-${Date.now()}.jpg`, file1);
console.log('Own folder upload:', result1);
// Expected: { data: { path: "..." }, error: null }

// Test 2: Try to upload to a different UUID (should fail)
const file2 = new File(['hack'], 'hack.jpg', { type: 'image/jpeg' });
const fakeUserId = '00000000-0000-0000-0000-000000000000';
const result2 = await supabase.storage
  .from('avatars')
  .upload(`${fakeUserId}/hack.jpg`, file2);
console.log('Other folder upload:', result2);
// Expected: { data: null, error: { statusCode: "42501" } }
```

---

## Expected Behaviour Summary

| User | Action | Path | Before Fix | After Fix |
|------|--------|------|------------|-----------|
| User A | Upload | `user-a-id/file.jpg` | ✅ Allowed | ✅ Allowed |
| User A | Upload | `user-b-id/file.jpg` | ❌ **Allowed (BUG!)** | ✅ **Denied** |
| User A | Upload | `file.jpg` (root) | ❌ Allowed | ✅ Denied |
| User A | Update | `user-a-id/file.jpg` | ✅ Allowed | ✅ Allowed |
| User A | Update | `user-b-id/file.jpg` | ❌ **Allowed (BUG!)** | ✅ **Denied** |
| User A | Delete | `user-a-id/file.jpg` | ✅ Allowed | ✅ Allowed |
| User A | Delete | `user-b-id/file.jpg` | ❌ **Allowed (BUG!)** | ✅ **Denied** |

---

## Attack Scenarios Prevented

### Scenario 1: Avatar Hijacking
**Before Fix:**
1. Attacker uploads to `victim-uuid/avatar.jpg`
2. Victim's profile now shows attacker's image
3. Social engineering attack vector

**After Fix:**
- Upload fails with RLS policy violation ✅

### Scenario 2: Malicious File Injection
**Before Fix:**
1. Attacker uploads `victim-uuid/malicious.svg` with XSS payload
2. If rendered inline, executes JavaScript
3. Potential account takeover

**After Fix:**
- Upload fails with RLS policy violation ✅
- Even if SVG allowed, can only inject into own folder

### Scenario 3: Storage Quota Abuse
**Before Fix:**
1. Attacker uploads large files to victim's folder
2. Victim's storage quota exhausted
3. Denial of service

**After Fix:**
- Upload fails with RLS policy violation ✅

---

## Rollback Procedure

If legitimate avatar uploads fail after migration:

```sql
-- Drop new policies
DROP POLICY IF EXISTS "Users can upload to own folder only" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own folder only" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from own folder only" ON storage.objects;

-- Restore original policies (INSECURE - temporary only)
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
```

Then investigate:
- Check if `storage.foldername()` function exists in your Supabase version
- Verify path format in `src/lib/storage.ts` matches `userId/filename` pattern
- Check Supabase logs for specific error messages

---

## Security Validation

### ✅ Prevents Path Traversal
- Users cannot upload to `../other-bucket/` paths
- Users cannot upload to other users' folders
- Database-level enforcement (cannot bypass with modified client)

### ✅ Maintains Functionality
- Legitimate avatar uploads continue to work
- Client code doesn't need changes (already uses correct path format)
- Frontend `uploadAvatarToStorage()` function works normally

### ✅ Defence in Depth
- Even if client-side validation bypassed, RLS enforces access control
- Attackers cannot use Supabase API directly to exploit vulnerability
- All operations (INSERT, UPDATE, DELETE) protected

---

## Sign-off

- [ ] All 8 test cases pass
- [ ] Browser console tests verified
- [ ] No regression in avatar upload functionality
- [ ] Negative tests (cross-user access) all fail as expected
- [ ] Migration applied to production
- [ ] Verified in production with real user accounts

**Tested by:** _________________
**Date:** _________________
**Sign-off:** _________________
