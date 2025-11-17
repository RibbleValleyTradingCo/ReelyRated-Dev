# ReelyRated Setup Guide

This guide will help you set up the ReelyRated development environment.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- **Git** installed

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/RibbleValleyTradingCo/ReelyRated-Codex.git
cd ReelyRated-Codex
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:5173
```

#### Where to Find Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANT:** Never use the `service_role` key in frontend code! Only use the `anon` or `public` key.

### 4. Run Database Migrations

Apply the database schema and security policies:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run migrations in order from `supabase/migrations/` directory
3. Or use Supabase CLI (if installed):

```bash
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 6. Verify Setup

Open the browser console and check for:

```
✅ Environment variables validated successfully
```

If you see errors, check the troubleshooting section below.

---

## Project Structure

```
ReelyRated-Codex/
├── docs/                    # Documentation
│   ├── baseline.md          # Security audit baseline
│   ├── risk-register.md     # Security risk assessment
│   └── setup.md            # This file
├── src/
│   ├── components/          # React components
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/       # Supabase client & types
│   ├── lib/                # Utility functions
│   │   ├── env-validation.ts  # Environment variable validation
│   │   └── storage.ts      # File storage helpers
│   ├── pages/              # Page components
│   └── main.tsx            # App entry point
├── supabase/
│   └── migrations/         # Database migrations
├── .env.example            # Example environment variables
└── vercel.json            # Security headers configuration
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public API key | `eyJhbG...` (100+ chars) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_URL` | Application base URL | `http://localhost:5173` |

### Alternate Variable Names

The app supports both naming conventions:
- `VITE_SUPABASE_ANON_KEY` (older)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (newer)

Use either one - they're functionally identical.

---

## Troubleshooting

### Blank Screen on Startup

**Symptom:** White/blank screen with no content

**Common Causes:**

1. **Missing environment variables**
   - Check browser console for validation errors
   - Verify `.env` file exists in project root
   - Ensure all required variables are set

2. **Invalid VITE_SUPABASE_URL**
   - Should be `https://xxx.supabase.co` format
   - NOT `http://127.0.0.1:5173` (that's your dev server!)
   - NOT `http://localhost:54321` (that's local Supabase)

3. **Invalid anon key format**
   - Should be 100+ characters long
   - Copy the entire key from Supabase Dashboard
   - Make sure you copied the `anon` key, not `service_role`

**Fix:**
1. Check console for validation errors
2. Compare your `.env` to `.env.example`
3. Restart dev server after fixing: `npm run dev`

---

### "supabaseKey is required" Error

**Symptom:** Error in console: `Uncaught Error: supabaseKey is required`

**Cause:** Missing `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`

**Fix:**
1. Add the variable to `.env`:
   ```env
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
2. Restart dev server: `npm run dev`

---

### Service Role Key Security Error

**Symptom:** Error: `CRITICAL SECURITY ISSUE: Service role key exposed`

**Cause:** You've added `VITE_SUPABASE_SERVICE_ROLE_KEY` to your environment variables

**Why This is Dangerous:**
- Service role key bypasses ALL Row-Level Security (RLS) policies
- Exposes it to client-side code = massive security vulnerability
- Anyone can view your key in browser DevTools

**Fix:**
1. Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env`
2. Remove it from Vercel environment variables (if deployed)
3. Use only `VITE_SUPABASE_ANON_KEY` for frontend code
4. Service role key should ONLY be used server-side or in Supabase Dashboard

---

### Authentication Not Working

**Symptom:** Can't sign in, OAuth redirects fail

**Possible Causes:**

1. **Incorrect VITE_APP_URL**
   - Must match your actual deployment URL
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

2. **Missing OAuth redirect URLs in Supabase**
   - Go to Supabase Dashboard → **Authentication** → **URL Configuration**
   - Add your app URL to allowed redirect URLs
   - For local dev: `http://localhost:5173/**`
   - For production: `https://your-domain.com/**`

---

### CSP Errors in Console

**Symptom:** Console warnings about Content Security Policy violations

**Example:**
```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates
the following Content Security Policy directive: "script-src 'self'"
```

**Is This a Problem?**
No! This is **expected behaviour**. Our strict Content Security Policy blocks external scripts for security. The Vercel feedback widget being blocked is correct.

**When to Worry:**
If you see CSP errors for YOUR app's scripts (not external widgets), that indicates a configuration issue.

---

### Database Migration Errors

**Symptom:** Tables don't exist, RLS policy errors

**Fix:**
1. Verify migrations are applied in Supabase Dashboard → **SQL Editor**
2. Run migrations manually from `supabase/migrations/` directory
3. Check migration order (run in filename order)
4. Key migrations:
   - `20251112111211_fix_storage_path_traversal.sql` (storage security)
   - `20251112114500_fix_admin_users_policies_final.sql` (admin policies)

---

## Deployment (Vercel)

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2. Set Environment Variables

In Vercel Dashboard → Project → **Settings** → **Environment Variables**, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
| `VITE_APP_URL` | Your Vercel URL | Production, Preview, Development |

⚠️ **Remember:** Set environment scope to **all three** (Production, Preview, Development)

### 3. Deploy

Click **Deploy**. Vercel will:
1. Install dependencies
2. Run build with environment variables
3. Deploy to CDN

### 4. Verify Deployment

1. Open your Vercel deployment URL
2. Check browser console for:
   ```
   ✅ Environment variables validated successfully
   ```
3. Test login/signup functionality

---

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build Locally

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## Security Best Practices

1. **Never commit `.env` file** (already in `.gitignore`)
2. **Never use service role key in frontend code**
3. **Always use HTTPS in production** (Vercel handles this automatically)
4. **Keep dependencies updated:** `npm audit` and `npm update`
5. **Review security headers** in `vercel.json`

---

## Getting Help

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

### Common Issues
- See `docs/risk-register.md` for known security issues
- See `docs/baseline.md` for application architecture
- Check `docs/phase-1-test-evidence.md` for security test results

### Support
If you encounter issues:
1. Check this guide's troubleshooting section
2. Check browser console for error messages
3. Verify environment variables are set correctly
4. Review relevant documentation files in `docs/`

---

## Next Steps

Once setup is complete:

1. **Explore the codebase**
   - Check `src/components/` for UI components
   - Review `src/pages/` for page routes
   - Look at `src/integrations/supabase/` for database interactions

2. **Review security documentation**
   - `docs/baseline.md` - Security baseline assessment
   - `docs/risk-register.md` - Security risks and mitigations
   - `docs/phase-1-test-evidence.md` - Security test results

3. **Start developing**
   - The app uses React + TypeScript + Vite
   - UI components from shadcn/ui
   - State management with React Query
   - Authentication via Supabase Auth

Happy coding! 🎣
