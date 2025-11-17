# ⚠️ CRITICAL SECURITY WARNING ⚠️

## Supabase Service Role Key

You mentioned having `SUPABASE_SERVICE_ROLE_KEY` in your environment variables.

### 🚨 IMMEDIATE ACTION REQUIRED

**The Service Role Key should NEVER be used in client-side code or Vercel environment variables for a frontend app!**

## Why This is Dangerous

The **Service Role Key**:
- ✅ Bypasses ALL Row Level Security (RLS) policies
- ✅ Has full admin access to your database
- ✅ Can read, modify, or delete ANY data
- ✅ Cannot be restricted or limited

If this key is exposed in your client-side code:
- 🔴 Anyone can extract it from your JavaScript bundle
- 🔴 Attackers can access/delete all user data
- 🔴 All your RLS policies are useless
- 🔴 Complete database compromise

## Correct Usage

### ✅ Frontend (Browser/Vercel) - Use These:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (anon/public key)
# OR
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG... (same as anon key)
```

The **anon/public key** is safe because:
- Security comes from RLS policies in the database
- Users can only access data they're authorized to see
- Cannot bypass RLS policies

### ❌ Backend Only (Server, NOT Vercel frontend) - Service Role:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (NEVER in frontend!)
```

Only use service role key in:
- Backend API servers (Node.js, Python, etc.)
- Server-side functions
- Admin scripts running on secure servers
- Local development scripts (NEVER committed to git)

## How to Check

### 1. Check Vercel Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**If you see `SUPABASE_SERVICE_ROLE_KEY`:**
- ❌ **DELETE IT IMMEDIATELY**
- Redeploy your app
- Rotate (regenerate) the service role key in Supabase Dashboard

### 2. Check Your Codebase

```bash
# Search for service role key usage
grep -r "SERVICE_ROLE" .
```

**If found in any client-side code:**
- Remove it immediately
- Commit and push
- Rotate the key in Supabase

## Current Environment Variables (Correct Setup)

Based on your message, you should have:

### ✅ Safe for Frontend:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (your anon key)
VITE_APP_URL=https://your-domain.vercel.app (optional)
```

### ❌ Remove from Frontend:
```
SUPABASE_SERVICE_ROLE_KEY=... (DELETE THIS FROM VERCEL!)
```

## Variable Name Differences

You mentioned these variable names:
- `VITE_SUPABASE_ANON_KEY` ✅ (old name for anon key)
- `VITE_SUPABASE_PUBLISHABLE_KEY` ✅ (new name for anon key)
- `VITE_APP_URL` ✅ (optional, for share URLs)

**These are all fine!** The code now supports both `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` - they're the same thing, just different names.

## How to Rotate Service Role Key (If Exposed)

If the service role key was ever in your frontend environment variables:

1. Go to Supabase Dashboard
2. Settings → API
3. Click "Reset" next to Service Role Key
4. Generate new key
5. Update ONLY your backend services (not Vercel)
6. Never add it to Vercel again

## Summary

**Current Fix Deployed:**
- ✅ Code now accepts `VITE_SUPABASE_ANON_KEY` (your current variable name)
- ✅ Also accepts `VITE_SUPABASE_PUBLISHABLE_KEY` (new naming)
- ✅ This should fix the blank screen

**Action Required:**
- ⚠️ Check if `SUPABASE_SERVICE_ROLE_KEY` is in Vercel environment variables
- ⚠️ If yes: DELETE it immediately and rotate the key in Supabase
- ⚠️ Never add service role key to frontend environment variables

## Questions?

If unsure which key is which in Supabase Dashboard:

**Settings → API:**
- ✅ **anon public** - Safe for frontend (use this)
- ❌ **service_role** - Backend only (DO NOT use in Vercel)

Both start with `eyJhbG...` but have different permissions!
