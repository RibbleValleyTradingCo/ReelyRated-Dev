# How to Enable Diagnostic Page

**Purpose:** Identify why Vercel shows a blank screen

---

## Quick Setup (2 minutes)

### Step 1: Edit src/App.tsx

Open `src/App.tsx` and add the diagnostic import and temporary route:

```typescript
import { DiagnosticPage } from "@/components/DiagnosticPage";

// ... existing imports ...

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            {/* TEMPORARY: Show diagnostic page */}
            <DiagnosticPage />

            {/* COMMENTED OUT: Restore this after debugging
            <Routes>
              <Route path="/" element={<Index />} />
              ... all routes ...
            </Routes>
            */}
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### Step 2: Commit and Deploy

```bash
git add src/App.tsx src/components/DiagnosticPage.tsx
git commit -m "Add diagnostic page for blank screen debugging"
git push
```

### Step 3: Check Vercel Preview

1. Wait for Vercel to deploy
2. Open the preview URL
3. You should see a diagnostic page showing:
   - ✅ or ❌ for each environment variable
   - Detailed instructions on how to fix

### Step 4: Fix Based on Results

**If variables are missing:**
- Follow instructions on diagnostic page
- Add them in Vercel Dashboard
- Redeploy

**If variables are set:**
- Check browser console (F12) for JavaScript errors
- Report the errors back

### Step 5: Restore Normal App

Once fixed, edit `src/App.tsx` back:

```typescript
// Remove or comment out:
// <DiagnosticPage />

// Uncomment:
<Routes>
  <Route path="/" element={<Index />} />
  ... all routes ...
</Routes>
```

```bash
git add src/App.tsx
git commit -m "Remove diagnostic page - issue resolved"
git push
```

---

## Alternative: Just Check Browser Console

If you prefer not to deploy diagnostic code, you can check directly:

1. Open Vercel preview URL
2. Press F12 (or right-click → Inspect)
3. Go to **Console** tab
4. Look for errors like:

```
Error: supabaseUrl is required
```

This tells you environment variables are missing.

---

## Need Help?

Report back with:
- Screenshot of diagnostic page
- OR screenshot of browser console errors
- OR Vercel build log errors

This will help identify the exact issue!
