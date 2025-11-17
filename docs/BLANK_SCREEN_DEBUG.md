# Blank Screen Debugging Guide

**Issue:** Vercel deployment shows blank screen
**Most Likely Cause:** Missing environment variables

---

## 🔍 Step 1: Check Browser Console

1. Open your Vercel preview URL
2. Press `F12` or right-click → "Inspect"
3. Go to the **Console** tab
4. Look for errors (they'll be red)

### Expected Errors (if env vars missing):

```javascript
// Supabase client creation fails
Error: supabaseUrl is required
// OR
Uncaught TypeError: Cannot read properties of undefined
```

---

## 🔧 Step 2: Check Vercel Environment Variables

### Go to Vercel Dashboard:

1. Navigate to your project: https://vercel.com/dashboard
2. Click on your project → **Settings** → **Environment Variables**

### Required Variables:

Check if these exist:

| Variable Name | Value Example | Required |
|--------------|---------------|----------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | ✅ YES |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbG...` (long string) | ✅ YES |
| `VITE_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | 🟡 Optional |

### ⚠️ IMPORTANT:
- Variable names MUST start with `VITE_` (Vite requires this prefix)
- They must be set for **ALL environments** (Production, Preview, Development)
- After adding/changing variables, you MUST **redeploy**

---

## 🛠️ Step 3: Add Missing Environment Variables

### In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. For each variable:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase project URL
   - **Environments:** Check **Production**, **Preview**, **Development**
4. Click **Save**
5. **Redeploy** your application (go to Deployments → click ⋮ → Redeploy)

### Where to find Supabase values:

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → use for `VITE_SUPABASE_URL`
   - **anon public** key → use for `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 🧪 Step 4: Test Locally First

Before redeploying, test that env vars work locally:

```bash
# Create .env file in project root
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_PUBLIC_SITE_URL=http://localhost:8080
EOF

# Start dev server
npm run dev

# Open http://localhost:8080
# If it works locally, the issue is definitely Vercel env vars
```

---

## 🔍 Step 5: Verify Vercel Build Logs

1. Go to Vercel Dashboard → **Deployments**
2. Click on the latest deployment
3. Go to **Build Logs**
4. Look for errors during build

### Expected successful output:
```
✓ built in 13.72s
```

### If build fails, check for:
- TypeScript errors
- Missing dependencies
- Build timeout

---

## 🚨 Other Possible Causes

### 1. CSP Blocking Scripts

Check browser console for CSP errors:
```
Refused to load script because it violates Content-Security-Policy
```

**Fix:** Our CSP should allow `script-src 'self'` (already configured in vercel.json)

### 2. Incorrect Base Path

If your Vercel URL is `https://project-name-xxxxx.vercel.app` but app expects different path:

Check **vercel.json** base setting (currently should be fine with our config)

### 3. React Router Issues

If main page loads but navigation breaks:

Check rewrites in `vercel.json`:
```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

---

## ✅ Quick Fix Checklist

- [ ] Environment variables added to Vercel
- [ ] Variables include `VITE_` prefix
- [ ] Variables applied to all environments (Production/Preview/Development)
- [ ] Redeployed after adding variables
- [ ] Checked browser console for errors
- [ ] Verified build logs show success

---

## 🔧 Temporary Diagnostic Build

If you still can't identify the issue, I can add a diagnostic page that shows:
- Whether env vars are loaded
- Supabase connection status
- JavaScript errors

Would you like me to create that?

---

## 📞 What to Report Back

Please check and report:

1. **Browser Console Errors:**
   ```
   [Copy any red errors here]
   ```

2. **Vercel Environment Variables Status:**
   - ✅ / ❌ VITE_SUPABASE_URL exists
   - ✅ / ❌ VITE_SUPABASE_PUBLISHABLE_KEY exists

3. **Build Status:**
   - ✅ Build successful
   - ❌ Build failed (paste error)

4. **What you see:**
   - Completely blank white screen
   - Blank with loading spinner
   - Error message
   - Something else

This will help me pinpoint the exact issue!
