# Phase 1 Testing Guide

This document provides testing strategies for Phase 1 of the ReelyRated database rebuild.

## Table of Contents

1. [Manual Testing Checklist](#manual-testing-checklist)
2. [Integration Tests](#integration-tests)
3. [E2E Tests](#e2e-tests)
4. [Running the Tests](#running-the-tests)

---

## Manual Testing Checklist

### Setup & Prerequisites

- [ ] Supabase project is created and running
- [ ] Environment variables are set (`.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- [ ] Phase 1 migration has been run successfully
- [ ] Lookup tables are seeded (water_types, baits, tags)

### User Authentication & Profiles

#### Sign Up Flow
- [ ] **Sign up as a new user** via Supabase Auth
  - Email: `testuser1@example.com`
  - Password: `TestPassword123!`
- [ ] **Verify profile auto-creation**
  - Open Supabase Table Editor → `profiles` table
  - Confirm a profile was created with:
    - `id` matching the `auth.users.id`
    - `username` auto-generated from email (e.g., `testuser1`)
    - `display_name` auto-generated from email prefix
    - `created_at` and `updated_at` timestamps set

#### Profile Updates
- [ ] **Update your profile** via the Profile Settings page
  - Change `display_name` to "Test User One"
  - Add a bio: "Carp fishing enthusiast"
  - Add location: "London, UK"
  - Add website: "https://example.com"
- [ ] **Verify updates in database**
  - Check `profiles` table
  - Confirm `updated_at` timestamp changed

#### Username Immutability
- [ ] **Try to change username** (should fail or be disabled in UI)
  - The `username` field should be read-only after creation
  - Database constraint prevents updates to username

---

### Sessions

#### Create Session
- [ ] **Create a new fishing session**
  - Title: "Summer Carp Session"
  - Venue: "Farlows Lake"
  - Date: Select a past date (e.g., 2024-08-15)
  - Notes: "Great evening session with calm conditions"
- [ ] **Verify session appears in database**
  - Check `sessions` table
  - Confirm `user_id` matches your profile ID
  - Confirm `deleted_at` is `NULL`

#### View Sessions
- [ ] **View your sessions list**
  - Sessions should appear ordered by date (most recent first)
  - Each session should show title, venue, date

#### Update Session
- [ ] **Edit a session** (if your UI supports it)
  - Change title or notes
  - Confirm `updated_at` timestamp changes

#### Soft Delete Session
- [ ] **Delete a session**
  - Confirm session is hidden from your sessions list
  - Check database: `deleted_at` should have a timestamp (not removed from DB)

---

### Catches

#### Create Catch (Linked to Session)
- [ ] **Create a catch linked to a session**
  - **Required fields:**
    - Image: Upload or paste URL: `https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800`
    - Title: "Beautiful Mirror Carp"
    - Species: "Mirror Carp"
    - Caught at: Select a date
  - **Optional fields:**
    - Description: "Amazing fight on a zig rig!"
    - Weight: 18.5 lb_oz
    - Length: 32 in
    - Location: "Farlows Lake"
    - Peg/Swim: "Peg 12"
    - Water Type: "Lake"
    - Bait: "Pop-up Boilies"
    - Method: "Zig Rig"
    - Time of Day: "Evening"
    - Conditions: Add weather info (if your form supports it)
    - Visibility: "Public"
- [ ] **Verify catch in database**
  - Check `catches` table
  - Confirm `session_id` is set
  - Confirm `user_id` matches your profile
  - Confirm `deleted_at` is `NULL`

#### Create Standalone Catch (No Session)
- [ ] **Create a catch without linking to a session**
  - Leave `session` field empty/null
  - Fill required fields: image, title, species, caught_at
- [ ] **Verify in database**
  - `session_id` should be `NULL`

#### View Catches
- [ ] **View your catches**
  - All your public catches should appear
  - Catches should show image, title, species, weight

#### View Public Feed
- [ ] **View public feed** (all public catches from all users)
  - If you have test data seeded, you should see catches from multiple users
  - Each catch should show the user's profile info

#### Soft Delete Catch
- [ ] **Delete a catch**
  - Catch should disappear from your profile and feed
  - Check database: `deleted_at` should be set (not removed from DB)

#### Privacy Levels
- [ ] **Create catches with different visibility levels**
  - Public catch: Should appear in public feed
  - Followers-only catch: Should NOT appear in public feed (Phase 2 will add followers feed)
  - Private catch: Should only appear on your own profile

#### Validation Rules
- [ ] **Try to create a catch with invalid data** (should fail):
  - [ ] Empty title → Should fail (constraint: `title_not_empty`)
  - [ ] Empty species → Should fail (constraint: `species_not_empty`)
  - [ ] Future date → Should fail (constraint: `caught_at_not_future`)
  - [ ] Negative weight → Should fail (constraint: `weight_positive`)
  - [ ] Negative length → Should fail (constraint: `length_positive`)
  - [ ] More than 6 gallery photos → Should fail (constraint: `gallery_photos_limit`)

---

### Lookup Tables

#### Water Types
- [ ] **Fetch water types** from database
  - Should return ~11 water types (commercial, club, river, canal, etc.)
  - Each should have `code`, `label`, `group_name`

#### Baits
- [ ] **Fetch baits** from database
  - Should return ~15 baits (sweetcorn, maggots, boilies, etc.)
  - Grouped by category (naturals, boilies, pellets, etc.)

#### Tags (Methods)
- [ ] **Fetch method tags** from database
  - Should return ~14 methods (float-fishing, waggler, feeder, pole, etc.)
  - Each should have `category` = 'method'

---

### Insights/Analytics (Basic)

- [ ] **View your total catch count**
  - Should match number of non-deleted catches
- [ ] **View your total session count**
  - Should match number of non-deleted sessions
- [ ] **View catches grouped by species**
  - If you have 3 carp, 2 pike, it should show that breakdown
- [ ] **View catches grouped by venue**
  - If you have 5 catches at "Farlows Lake", 2 at "Linear Fisheries", should show that

---

## Integration Tests

Integration tests verify that your database queries work correctly. Use **Vitest** or **Jest** for these.

### Setup

Create a test file: `src/lib/__tests__/supabase-queries.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import {
  createSession,
  getUserSessions,
  createCatch,
  getUserCatches,
  getPublicCatchesFeed,
} from '@/lib/supabase-queries';

// You'll need a test user ID (create this manually in Supabase for testing)
const TEST_USER_ID = 'your-test-user-uuid-here';

describe('Supabase Queries - Phase 1', () => {
  describe('Sessions', () => {
    it('should create a new session', async () => {
      const session = await createSession({
        user_id: TEST_USER_ID,
        title: 'Test Session',
        venue: 'Test Lake',
        date: '2024-01-15',
        notes: 'Test notes',
      });

      expect(session).toBeDefined();
      expect(session.title).toBe('Test Session');
      expect(session.user_id).toBe(TEST_USER_ID);
    });

    it('should fetch user sessions', async () => {
      const sessions = await getUserSessions(TEST_USER_ID);

      expect(Array.isArray(sessions)).toBe(true);
      // Should be ordered by date desc
      if (sessions.length > 1) {
        const date1 = new Date(sessions[0].date || sessions[0].created_at);
        const date2 = new Date(sessions[1].date || sessions[1].created_at);
        expect(date1 >= date2).toBe(true);
      }
    });

    it('should not return soft-deleted sessions', async () => {
      // Create a session, then soft delete it
      const session = await createSession({
        user_id: TEST_USER_ID,
        title: 'To Be Deleted',
        venue: 'Test',
      });

      // Soft delete it (you'll need to add this query function)
      // await deleteSession(session.id);

      // Fetch sessions - should not include deleted one
      const sessions = await getUserSessions(TEST_USER_ID);
      const deletedSession = sessions.find(s => s.id === session.id);
      expect(deletedSession).toBeUndefined();
    });
  });

  describe('Catches', () => {
    it('should create a new catch', async () => {
      const catchData = await createCatch({
        user_id: TEST_USER_ID,
        image_url: 'https://example.com/image.jpg',
        title: 'Test Carp',
        species: 'Common Carp',
        caught_at: '2024-01-15',
        weight: 12.5,
        weight_unit: 'lb_oz',
        visibility: 'public',
      });

      expect(catchData).toBeDefined();
      expect(catchData.title).toBe('Test Carp');
      expect(catchData.species).toBe('Common Carp');
      expect(catchData.weight).toBe(12.5);
    });

    it('should fetch user catches ordered by date', async () => {
      const catches = await getUserCatches(TEST_USER_ID);

      expect(Array.isArray(catches)).toBe(true);
      // Should be ordered by caught_at desc
      if (catches.length > 1) {
        const date1 = new Date(catches[0].caught_at);
        const date2 = new Date(catches[1].caught_at);
        expect(date1 >= date2).toBe(true);
      }
    });

    it('should only return public catches in feed', async () => {
      const feed = await getPublicCatchesFeed(10);

      expect(Array.isArray(feed)).toBe(true);
      // All should be public
      feed.forEach(catchItem => {
        expect(catchItem.visibility).toBe('public');
        expect(catchItem.deleted_at).toBeNull();
      });
    });

    it('should include profile data in feed', async () => {
      const feed = await getPublicCatchesFeed(1);

      if (feed.length > 0) {
        expect(feed[0].profile).toBeDefined();
        expect(feed[0].profile.username).toBeDefined();
      }
    });
  });

  describe('Lookup Tables', () => {
    it('should fetch water types', async () => {
      const { getWaterTypes } = await import('@/lib/supabase-queries');
      const waterTypes = await getWaterTypes();

      expect(waterTypes.length).toBeGreaterThan(0);
      expect(waterTypes[0]).toHaveProperty('code');
      expect(waterTypes[0]).toHaveProperty('label');
      expect(waterTypes[0]).toHaveProperty('group_name');
    });

    it('should fetch baits', async () => {
      const { getBaits } = await import('@/lib/supabase-queries');
      const baits = await getBaits();

      expect(baits.length).toBeGreaterThan(0);
      expect(baits[0]).toHaveProperty('slug');
      expect(baits[0]).toHaveProperty('label');
      expect(baits[0]).toHaveProperty('category');
    });

    it('should fetch methods', async () => {
      const { getMethods } = await import('@/lib/supabase-queries');
      const methods = await getMethods();

      expect(methods.length).toBeGreaterThan(0);
      methods.forEach(method => {
        expect(method.category).toBe('method');
      });
    });
  });
});
```

### Running Integration Tests

```bash
npm run test
# or
vitest
```

---

## E2E Tests

E2E tests simulate real user workflows. Use **Playwright** for these.

### Setup Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

Create `tests/e2e/phase1.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// Update these with your actual URLs and credentials
const APP_URL = 'http://localhost:5173'; // Your Vite dev server
const TEST_EMAIL = 'e2e-test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Phase 1 - Core Logging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test('should sign up, create session, and create catch', async ({ page }) => {
    // 1. Sign up
    await page.click('text=Sign Up'); // Adjust selector to match your UI
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign Up")');

    // Wait for redirect to profile/dashboard
    await page.waitForURL(/profile|dashboard/);

    // 2. Verify profile was auto-created
    await page.click('text=Profile Settings'); // Navigate to settings
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toHaveValue(/e2e/); // Should contain "e2e" from email

    // 3. Update profile
    await page.fill('input[name="display_name"]', 'E2E Test User');
    await page.fill('textarea[name="bio"]', 'This is an E2E test account');
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.locator('text=Profile updated')).toBeVisible();

    // 4. Create a session
    await page.click('text=New Session'); // Navigate to create session
    await page.fill('input[name="title"]', 'E2E Test Session');
    await page.fill('input[name="venue"]', 'Test Lake');
    await page.fill('input[name="date"]', '2024-01-15');
    await page.fill('textarea[name="notes"]', 'Testing session creation');
    await page.click('button:has-text("Create Session")');

    // Verify session appears in list
    await expect(page.locator('text=E2E Test Session')).toBeVisible();

    // 5. Create a catch
    await page.click('text=New Catch');
    await page.fill('input[name="title"]', 'E2E Test Carp');
    await page.fill('input[name="species"]', 'Common Carp');
    await page.fill('input[name="caught_at"]', '2024-01-15');
    await page.fill('input[name="image_url"]', 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800');
    await page.fill('input[name="weight"]', '15.5');
    await page.selectOption('select[name="weight_unit"]', 'lb_oz');
    await page.click('button:has-text("Create Catch")');

    // Verify catch appears in feed
    await page.click('text=Feed'); // Navigate to feed
    await expect(page.locator('text=E2E Test Carp')).toBeVisible();
  });

  test('should view public catch feed', async ({ page }) => {
    // Navigate to public feed (without logging in)
    await page.goto(`${APP_URL}/feed`);

    // Should show public catches
    await expect(page.locator('[data-testid="catch-card"]')).toHaveCount(3, { timeout: 5000 }); // Assuming you have seed data
  });

  test('should filter catches by species', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Login")');

    // Navigate to feed
    await page.goto(`${APP_URL}/feed`);

    // Filter by species
    await page.selectOption('select[name="species-filter"]', 'Common Carp');

    // All visible catches should be Common Carp
    const catchCards = page.locator('[data-testid="catch-card"]');
    const count = await catchCards.count();
    for (let i = 0; i < count; i++) {
      await expect(catchCards.nth(i)).toContainText('Common Carp');
    }
  });
});
```

### Running E2E Tests

```bash
npx playwright test
```

---

## Test Database Setup

For a clean test environment, you can:

1. **Use a separate Supabase project** for testing
2. **Reset your database** before running tests:
   ```sql
   -- Drop all data (careful!)
   TRUNCATE catches, sessions, profiles CASCADE;
   ```
3. **Seed test data** before E2E tests:
   ```bash
   psql -h your-db-host -U postgres -d postgres -f supabase/seed-phase1-test-data.sql
   ```

---

## Checklist Summary

### Before Moving to Phase 2

- [ ] All manual tests pass
- [ ] Integration tests written and passing
- [ ] At least 2 E2E test scenarios pass
- [ ] Database constraints are working (try to insert bad data)
- [ ] RLS policies work (try to access another user's private data)
- [ ] Soft deletes work for sessions and catches
- [ ] Profile auto-creation trigger works on sign up
- [ ] Lookup tables are properly seeded
- [ ] Performance is acceptable (basic queries run < 100ms)

Once all Phase 1 tests pass, you're ready to move to **Phase 2: Social Features**!
