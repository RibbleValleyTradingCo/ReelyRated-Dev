# SEC-003 Test Plan: Environment Variable Validation

**Issue:** No validation of required environment variables at startup (CVSS 6.5)
**Fix:** Add runtime validation with clear error messages
**Files Changed:**
- `src/lib/env-validation.ts` (new)
- `src/main.tsx` (updated)

---

## Test Environment Setup

### Prerequisites
- Local development environment
- Access to Vercel environment variables (for production testing)
- Browser developer tools

---

## Test Cases

### ✅ Test 1: Valid configuration (should succeed)

**Setup:**
- All required environment variables set correctly
- VITE_SUPABASE_URL: Valid Supabase URL (https://xxx.supabase.co)
- VITE_SUPABASE_ANON_KEY: Valid anon key (100+ characters)

**Test:**
1. Start the app locally or deploy to Vercel
2. Open browser and navigate to app
3. Open DevTools console

**Expected Result:**
```
✅ Environment variables validated successfully
```

**Status:** App loads normally with validation passing

---

### 🔒 Test 2: Missing VITE_SUPABASE_URL (should fail with clear error)

**Setup:**
1. Remove or comment out VITE_SUPABASE_URL from .env
2. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
❌ Environment Variable Validation Failed

Variable: VITE_SUPABASE_URL
Issue: Missing required environment variable
Suggestion: Add VITE_SUPABASE_URL to your .env file (e.g., https://xxx.supabase.co)

Error: Environment variable validation failed. Check console for details.
```

**Status:** ✅ App fails to load with clear error message (not blank screen)

---

### 🔒 Test 3: Invalid VITE_SUPABASE_URL format (should fail)

**Setup:**
1. Set VITE_SUPABASE_URL to invalid value: `not-a-url`
2. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
❌ Environment Variable Validation Failed

Variable: VITE_SUPABASE_URL
Issue: Invalid URL format
Suggestion: Value "not-a-url" is not a valid URL. Should be https://xxx.supabase.co
```

**Status:** ✅ App fails with clear error explaining the issue

---

### ⚠️ Test 4: Localhost URL (should warn)

**Setup:**
1. Set VITE_SUPABASE_URL to `http://127.0.0.1:5173`
2. Set VITE_SUPABASE_ANON_KEY to valid key
3. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
⚠️  Environment Variable Warnings

Variable: VITE_SUPABASE_URL
Issue: Using localhost URL
Suggestion: This looks like a local dev server URL. For production, use your Supabase project URL (https://xxx.supabase.co)
```

**Status:** ✅ App loads but shows warning (this was the blank screen issue we had!)

---

### 🔒 Test 5: Missing anon key (should fail)

**Setup:**
1. Remove both VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY
2. Keep VITE_SUPABASE_URL valid
3. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
❌ Environment Variable Validation Failed

Variable: VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY
Issue: Missing required environment variable
Suggestion: Add either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY to your .env file
```

**Status:** ✅ App fails with clear error

---

### 🔒 Test 6: Invalid anon key format (should fail)

**Setup:**
1. Set VITE_SUPABASE_ANON_KEY to short/invalid value: `invalid-key-123`
2. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
❌ Environment Variable Validation Failed

Variable: VITE_SUPABASE_ANON_KEY
Issue: Invalid key format
Suggestion: Supabase anon keys should be long strings (100+ characters). Check your Supabase dashboard settings.
```

**Status:** ✅ App fails with helpful error

---

### 🚨 Test 7: Service role key detected (CRITICAL - should fail)

**Setup:**
1. Add VITE_SUPABASE_SERVICE_ROLE_KEY to environment variables
2. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
❌ Environment Variable Validation Failed

Variable: VITE_SUPABASE_SERVICE_ROLE_KEY
Issue: CRITICAL SECURITY ISSUE: Service role key exposed in client code!
Suggestion: IMMEDIATELY remove VITE_SUPABASE_SERVICE_ROLE_KEY from your environment variables. This key bypasses all RLS policies and should NEVER be in frontend code. Use only the anon/publishable key.
```

**Status:** ✅ App fails with CRITICAL warning (prevents massive security hole)

---

### ✅ Test 8: Both PUBLISHABLE_KEY and ANON_KEY present (should succeed)

**Setup:**
1. Set both VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY
2. Both have valid values
3. Restart dev server

**Test:**
Open browser and check console

**Expected Result:**
```
✅ Environment variables validated successfully
```

**Status:** ✅ App loads (uses PUBLISHABLE_KEY as fallback per client.ts)

---

## Browser Console Manual Test

Run this in DevTools console to test validation logic:

```javascript
// Test the validation function directly
import { validateEnvironmentVariables } from './src/lib/env-validation';

const result = validateEnvironmentVariables();
console.log('Validation result:', result);
console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
```

---

## Benefits of This Fix

### Before SEC-003 Fix:
- Missing env vars → Blank screen with cryptic error
- Invalid URL (127.0.0.1) → Blank screen, hard to debug
- Service role key exposed → Silent security vulnerability
- Wrong key format → Confusing Supabase errors

### After SEC-003 Fix:
- Missing env vars → ✅ Clear error: "Missing VITE_SUPABASE_URL"
- Invalid URL → ✅ Clear error with example of correct format
- Service role key exposed → ✅ CRITICAL warning, app refuses to start
- Wrong key format → ✅ Clear error with length requirements
- Localhost URL → ⚠️ Warning (helps catch deployment issues)

---

## Production Deployment Test

### Vercel Deployment
1. Deploy branch to Vercel
2. Open deployed URL
3. Check browser console
4. Should see: `✅ Environment variables validated successfully`

### If Validation Fails in Production:
1. Go to Vercel project settings → Environment Variables
2. Check the error message in console
3. Add/fix the missing variable
4. Redeploy (Vercel auto-redeploys on env var changes)

---

## Edge Cases Handled

| Scenario | Behaviour | Message |
|----------|-----------|---------|
| Empty string URL | Error | "Invalid URL format" |
| URL without protocol | Error | "Invalid URL format" |
| Very short key (<50 chars) | Error | "Invalid key format" |
| Key with special characters | Error | "Invalid key format" |
| Both keys present | Success | Uses PUBLISHABLE_KEY (per fallback logic) |
| Localhost in production | Warning | "Using localhost URL" |
| Non-supabase URL | Warning | "Unexpected URL format" |
| Service role key present | Error (CRITICAL) | Refuses to start |

---

## Rollback Procedure

If validation causes legitimate configurations to fail:

```typescript
// In src/main.tsx, temporarily comment out validation:
// validateEnvironmentOrThrow();

// Or create bypass flag in .env:
// VITE_SKIP_ENV_VALIDATION=true

// Then in env-validation.ts:
if (import.meta.env.VITE_SKIP_ENV_VALIDATION === 'true') {
  console.warn('⚠️  Environment validation skipped');
  return;
}
```

Then investigate:
- Check what configuration is being rejected
- Review validation rules in `src/lib/env-validation.ts`
- Adjust validation logic if rules are too strict

---

## Security Impact

### ✅ Prevents Security Issues:
1. **Service role key exposure** - Detects and refuses to start if present
2. **Configuration mistakes** - Catches localhost URLs in production
3. **Missing keys** - Prevents app from running with missing authentication

### ✅ Improves Developer Experience:
1. **Faster debugging** - Clear errors instead of blank screen
2. **Self-documenting** - Error messages explain what's wrong
3. **Fail fast** - Catches issues at startup, not deep in the app

### ✅ Defence in Depth:
1. **Validation at app startup** - Before Supabase client initialises
2. **Type-level safety** - TypeScript types already enforce non-null
3. **Runtime safety** - Validates actual values, not just presence

---

## Sign-off Checklist

- [ ] All 8 test cases pass
- [ ] Valid configuration loads without errors
- [ ] Invalid configurations show clear error messages
- [ ] Warnings show for suspicious but valid configs
- [ ] Service role key detection working (CRITICAL)
- [ ] Production deployment validates successfully
- [ ] No regression in existing functionality

**Tested by:** _________________
**Date:** _________________
**Status:** _________________
