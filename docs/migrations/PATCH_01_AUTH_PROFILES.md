# PATCH 01: Auth & Profile Updates

## Overview
Updates authentication and profile-related files to align with the new schema structure where `profiles.id` becomes `profiles.user_id`.

## Files Affected
- `src/lib/profile.ts` (No changes needed - already uses user_id)
- `src/hooks/useProfile.ts` (No changes needed - already uses user_id)

## Schema Changes Summary

### profiles table
**Old Schema:**
```sql
id UUID PRIMARY KEY (references auth.users.id)
username TEXT
display_name TEXT
avatar_url TEXT
```

**New Schema:**
```sql
user_id UUID PRIMARY KEY (references auth.users.id)
username CITEXT (case-insensitive, unique)
full_name TEXT (renamed from display_name)
avatar_path TEXT (new, preferred)
avatar_url TEXT (legacy field)
bio TEXT
location TEXT
website TEXT
warn_count INTEGER
moderation_status moderation_status
suspension_until TIMESTAMPTZ
```

## Analysis Results

### ✅ src/lib/profile.ts
**Status:** NO CHANGES REQUIRED

This file already correctly uses:
- `profiles.user_id` ✓
- `profiles.username` ✓
- `profiles.avatar_url` ✓

The query structure is already compatible with the new schema.

### ✅ src/hooks/useProfile.ts
**Status:** NO CHANGES REQUIRED

This file already correctly uses:
- `profiles.user_id` ✓
- `profiles.username` ✓
- `profiles.avatar_url` ✓

No migration needed.

## Future Enhancements (Optional)

While no immediate changes are required, consider these future improvements:

### 1. Add New Profile Fields
```typescript
// In src/lib/profile.ts
interface ProfileData {
  user_id: string;
  username: string;
  full_name?: string;  // NEW: Use instead of display_name
  avatar_path?: string; // NEW: Preferred over avatar_url
  avatar_url?: string;  // Legacy support
  bio?: string;         // NEW
  location?: string;    // NEW
  website?: string;     // NEW
}
```

### 2. Support avatar_path Priority
```typescript
// Helper function to get avatar with fallback
const getAvatarUrl = (profile: Profile): string | null => {
  // Prefer avatar_path, fallback to avatar_url
  return profile.avatar_path || profile.avatar_url || null;
};
```

### 3. Add Moderation Status Checks
```typescript
// Check if user is suspended/banned
const isUserRestricted = (profile: Profile): boolean => {
  if (profile.moderation_status === 'banned') return true;
  if (profile.moderation_status === 'suspended') {
    return profile.suspension_until && new Date(profile.suspension_until) > new Date();
  }
  return false;
};
```

## Testing Recommendations

1. **Profile Loading**
   - ✓ Verify profile data loads correctly after migration
   - ✓ Test getProfilePath() generates correct URLs
   - ✓ Test getUsernameFromPathParam() parses correctly

2. **Profile Queries**
   - ✓ Check all SELECT queries work with user_id
   - ✓ Verify avatar_url still displays correctly
   - ✓ Test username lookups (case-insensitive)

3. **Edge Cases**
   - ✓ Test profiles without usernames
   - ✓ Test profiles without avatars
   - ✓ Test case-insensitive username matching

## Breaking Changes
**NONE** - These files are already compatible with the new schema.

## Notes
- The new schema uses `user_id` instead of `id` as the primary key
- The application code already uses `user_id` throughout, so no changes needed
- `username` is now CITEXT (case-insensitive) in database
- New fields (bio, location, website, moderation_status) can be added incrementally

## Validation Checklist
- [x] Reviewed all profile queries
- [x] Verified user_id usage is consistent
- [x] Confirmed no breaking changes
- [x] Identified future enhancement opportunities
