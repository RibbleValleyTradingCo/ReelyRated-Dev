# Schema V2 Query Mappings

This document shows how to update existing queries to work with the new schema.

## Breaking Changes Summary

| Old Schema | New Schema | Impact |
|------------|------------|--------|
| `profiles.id` | `profiles.user_id` | **HIGH** - All FK references change |
| `catches.species` (TEXT) | `catches.species_id` + `species_slug` | **MEDIUM** - Need to join species table or use slug |
| `catches.location` (TEXT) | `catches.location_label` + `normalized_location` | **LOW** - Rename column |
| No venues table | `venues` table + `catches.venue_id` | **MEDIUM** - New feature, optional |
| Simple reactions | `reaction_type` enum (like/love/fire) | **LOW** - Add reaction type |

---

## 1. PROFILE QUERIES

### OLD: Query profile
```typescript
const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_path, bio')
    .eq('username', 'mike')
    .single();
```

### NEW: Query profile (Column name change)
```typescript
const { data } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_path, bio')
    .eq('username', 'mike')
    .single();

// Access via: data.user_id (not data.id)
```

---

## 2. FEED QUERIES

### OLD: Global feed
```typescript
const { data } = await supabase
    .from('catches')
    .select(`
        *,
        profiles:user_id (username, avatar_path),
        ratings (rating),
        comments:catch_comments (id),
        reactions:catch_reactions (user_id)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
```

### NEW: Global feed (Add species and venue joins)
```typescript
const { data } = await supabase
    .from('catches')
    .select(`
        *,
        profiles:user_id (user_id, username, avatar_path, avatar_url),
        species:species_id (slug, common_name, image_url),
        venue:venue_id (name, region, slug),
        ratings (rating),
        comments:catch_comments (id),
        reactions:catch_reactions (user_id, reaction)
    `)
    .is('deleted_at', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
```

**Key changes:**
- `profiles.user_id` instead of `profiles.id`
- Add `species:species_id` join for species data
- Add `venue:venue_id` join for venue data
- `reactions` now include `reaction` type (like/love/fire)

---

### OLD: Following feed
```typescript
// Get following list
const { data: follows } = await supabase
    .from('profile_follows')
    .select('following_id')
    .eq('follower_id', userId);

const followingIds = follows?.map(f => f.following_id) || [];

// Get catches from following
const { data } = await supabase
    .from('catches')
    .select(`*, profiles:user_id (...)`)
    .in('user_id', followingIds)
    .is('deleted_at', null);
```

### NEW: Following feed (Same logic, just update joins)
```typescript
// Get following list
const { data: follows } = await supabase
    .from('profile_follows')
    .select('following_id')
    .eq('follower_id', userId);

const followingIds = follows?.map(f => f.following_id) || [];

// Get catches from following
const { data } = await supabase
    .from('catches')
    .select(`
        *,
        profiles:user_id (user_id, username, avatar_path),
        species:species_id (slug, common_name),
        venue:venue_id (name, region)
    `)
    .in('user_id', followingIds)
    .is('deleted_at', null)
    .in('visibility', ['public', 'followers']);
```

---

## 3. SEARCH QUERIES

### OLD: Profile search
```typescript
const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_path, bio')
    .or(`username.ilike.%${query}%,bio.ilike.%${query}%`);
```

### NEW: Profile search
```typescript
const { data } = await supabase
    .from('profiles')
    .select('user_id, username, full_name, avatar_path, bio, location')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`);
```

**Key changes:**
- `user_id` instead of `id`
- Search `full_name` in addition to username/bio
- Optionally search `location`

---

### OLD: Catch search (by species text)
```typescript
const { data } = await supabase
    .from('catches')
    .select('*, profiles:user_id (...)')
    .ilike('species', `%${speciesQuery}%`);
```

### NEW: Catch search (by species slug or custom_species)
```typescript
const { data } = await supabase
    .from('catches')
    .select(`
        *,
        profiles:user_id (user_id, username, avatar_path),
        species:species_id (slug, common_name)
    `)
    .or(`species_slug.ilike.%${speciesQuery}%,custom_species.ilike.%${speciesQuery}%`);
```

**OR** if you want exact species match:
```typescript
const { data } = await supabase
    .from('catches')
    .select(`*, species:species_id (common_name)`)
    .eq('species_slug', speciesSlug); // Exact match on slug
```

---

### OLD: Venue search (by location text field)
```typescript
const { data } = await supabase
    .from('catches')
    .select('location')
    .ilike('location', `%${venueQuery}%`);
```

### NEW: Venue search (search venues table + catch location_label)
```typescript
// Search venues table directly
const { data: venues } = await supabase
    .from('venues')
    .select('id, slug, name, region, country')
    .or(`name.ilike.%${query}%,region.ilike.%${query}%`);

// OR search catches by location_label (for free-text locations)
const { data: catches } = await supabase
    .from('catches')
    .select(`
        location_label,
        normalized_location,
        venue:venue_id (name, region, slug)
    `)
    .or(`location_label.ilike.%${query}%,normalized_location.ilike.%${query}%`);
```

---

## 4. LEADERBOARD QUERIES

### OLD: Manual leaderboard calculation
```typescript
const { data } = await supabase
    .from('catches')
    .select(`
        *,
        profiles:user_id (username),
        ratings (rating)
    `)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('weight', { ascending: false })
    .limit(100);

// Calculate avg_rating client-side
```

### NEW: Use leaderboard view
```typescript
// Query the materialized view (faster)
const { data } = await supabase
    .from('leaderboard_scores_mv')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(100);

// OR query the regular view (always fresh)
const { data } = await supabase
    .from('leaderboard_scores_detailed')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(100);
```

**Filter by species:**
```typescript
const { data } = await supabase
    .from('leaderboard_scores_mv')
    .select('*')
    .eq('species_slug', 'mirror_carp')
    .order('total_score', { ascending: false });
```

---

## 5. ADD CATCH FLOW

### OLD: Insert catch
```typescript
const { data, error } = await supabase
    .from('catches')
    .insert({
        user_id: userId,
        title: 'My catch',
        species: 'common_carp',
        location: 'Linear Fisheries',
        weight: 25.0,
        image_url: imageUrl
    });
```

### NEW: Insert catch (with species/venue references)
```typescript
// Option A: Reference existing species by ID
const { data: species } = await supabase
    .from('species')
    .select('id, slug')
    .eq('slug', 'common_carp')
    .single();

const { data, error } = await supabase
    .from('catches')
    .insert({
        user_id: userId,
        title: 'My catch',
        species_id: species.id,
        species_slug: species.slug, // Denormalized for speed
        location_label: 'Linear Fisheries',
        weight: 25.0,
        image_url: imageUrl,
        caught_at: new Date().toISOString()
    });

// Option B: Use custom_species if not in catalog
const { data, error } = await supabase
    .from('catches')
    .insert({
        user_id: userId,
        title: 'My catch',
        custom_species: 'Rare Hybrid Carp',
        location_label: 'Linear Fisheries',
        weight: 25.0,
        image_url: imageUrl
    });

// Option C: Reference existing venue
const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('slug', 'linear-fisheries')
    .single();

const { data, error } = await supabase
    .from('catches')
    .insert({
        user_id: userId,
        venue_id: venue.id,
        location_label: 'Linear Fisheries', // Still store label for display
        // ... rest of fields
    });
```

---

## 6. SESSIONS QUERIES

### OLD: Query user sessions
```typescript
const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
```

### NEW: Query user sessions (with venue join)
```typescript
const { data } = await supabase
    .from('sessions')
    .select(`
        *,
        venue:venue_id (name, slug, region)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false });
```

**Insert session with venue:**
```typescript
const { data, error } = await supabase
    .from('sessions')
    .insert({
        user_id: userId,
        title: 'Summer session at Linear',
        venue_id: venueId, // FK to venues table
        date: '2024-07-15',
        notes: 'Great conditions'
    });
```

---

## 7. INSIGHTS/ANALYTICS QUERIES

### OLD: Get user catches for analytics
```typescript
const { data } = await supabase
    .from('catches')
    .select('id, created_at, weight, species, location, method')
    .eq('user_id', userId);
```

### NEW: Get user catches with full context
```typescript
const { data } = await supabase
    .from('catches')
    .select(`
        id,
        created_at,
        caught_at,
        weight,
        weight_unit,
        species_slug,
        species:species_id (common_name, category),
        location_label,
        normalized_location,
        venue:venue_id (name, region),
        water_type_code,
        method_tag,
        time_of_day,
        bait_used,
        conditions
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('caught_at', { ascending: false });
```

**Group by venue:**
```typescript
// Client-side grouping after fetching with venue join
const catchesByVenue = data?.reduce((acc, catch) => {
    const venueName = catch.venue?.name || catch.location_label || 'Unknown';
    if (!acc[venueName]) acc[venueName] = [];
    acc[venueName].push(catch);
    return acc;
}, {});
```

---

## 8. NOTIFICATION QUERIES

### OLD: Fetch notifications
```typescript
const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
```

### NEW: Fetch notifications (with actor profile)
```typescript
const { data } = await supabase
    .from('notifications')
    .select(`
        *,
        actor:actor_id (user_id, username, avatar_path)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
```

---

## 9. ADMIN QUERIES

### OLD: Query reports
```typescript
const { data } = await supabase
    .from('reports')
    .select(`
        *,
        reporter:reporter_id (username)
    `)
    .eq('status', 'open');
```

### NEW: Query reports (same, just update FK references)
```typescript
const { data } = await supabase
    .from('reports')
    .select(`
        *,
        reporter:reporter_id (user_id, username),
        resolver:resolved_by (user_id, username)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
```

---

## 10. RPC FUNCTION CALLS

### OLD: Call admin delete catch (if existed)
```typescript
await supabase.rpc('admin_delete_catch', {
    catch_id: catchId,
    reason: 'Inappropriate'
});
```

### NEW: Same syntax (RPC signature unchanged)
```typescript
await supabase.rpc('admin_delete_catch', {
    p_catch_id: catchId,
    p_reason: 'Inappropriate content'
});
```

**New rate limiting RPC:**
```typescript
// Check if user can perform action
const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_action: 'catch_creation',
    p_max_attempts: 10,
    p_window_minutes: 60
});

if (!allowed) {
    // Show rate limit error
}

// Get rate limit status for display
const { data: status } = await supabase.rpc('get_rate_limit_status', {
    p_user_id: userId,
    p_action: 'catch_creation',
    p_max_attempts: 10,
    p_window_minutes: 60
});

console.log(`Attempts: ${status.used}/${status.allowed}, Resets at: ${status.reset_at}`);
```

---

## Summary of Changes Needed

### High Priority (Breaking)
1. ✅ Change all references from `profiles.id` → `profiles.user_id`
2. ✅ Update catch queries to use `species_slug` or join `species` table
3. ✅ Update reaction queries to handle `reaction_type` enum

### Medium Priority (New Features)
4. ✅ Add `venue` joins where location context is needed
5. ✅ Use `leaderboard_scores_detailed` view instead of manual calculations
6. ✅ Update search to use `normalized_location` and `species_slug`

### Low Priority (Enhancements)
7. ✅ Update insights queries to include new fields (time_of_day, water_type_code, etc.)
8. ✅ Add session-venue relationships in session queries

---

## Migration Checklist

- [ ] Update all profile queries to use `user_id` instead of `id`
- [ ] Update catch feed queries to join species and venues
- [ ] Update search queries for species (slug-based)
- [ ] Update leaderboard to use materialized view
- [ ] Update add-catch flow to reference species/venues
- [ ] Test RLS policies with new schema
- [ ] Update TypeScript types to match new schema
- [ ] Test rate limiting triggers
- [ ] Test admin RPC functions
- [ ] Refresh leaderboard materialized view (or set up cron job)
