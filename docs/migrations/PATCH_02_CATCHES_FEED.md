# PATCH 02: Catches & Feed Updates

## Overview
Updates all catch-related functionality to align with new schema field names and structure.

## Files Affected
- `src/lib/catches.ts`
- `src/hooks/useCatches.ts`

## Schema Changes Summary

### catches table
**Old Schema:**
```sql
id UUID
user_id UUID
title TEXT
species TEXT (free text)
location TEXT
bait_used TEXT
method TEXT (free text)
weight NUMERIC
weight_unit weight_unit
caught_at TIMESTAMPTZ
conditions JSON
```

**New Schema:**
```sql
id UUID
user_id UUID
session_id UUID (FK to sessions)
venue_id UUID (FK to venues)
species_id UUID (FK to species)
title TEXT
species_slug CITEXT (denormalized)
custom_species TEXT
location_label TEXT (renamed from location)
normalized_location CITEXT (new)
bait_used TEXT
method_tag TEXT (references tags table)
equipment_used TEXT (new)
weight NUMERIC(8,2)
weight_unit weight_unit
length NUMERIC(8,2) (new)
length_unit length_unit (new)
caught_at TIMESTAMPTZ
time_of_day time_of_day (enum)
conditions JSONB (upgraded from JSON)
tags TEXT[] (new)
gallery_photos TEXT[] (new)
video_url TEXT (new)
visibility visibility_type (new)
hide_exact_spot BOOLEAN (new)
allow_ratings BOOLEAN (new)
deleted_at TIMESTAMPTZ (soft delete)
```

## Required Changes

### src/lib/catches.ts

#### Change 1: Update fetchCatches query fields
**Location:** Line 37-42

**Current:**
```typescript
const { data, error } = await supabase
  .from("catches")
  .select(`
    id, created_at, caught_at, weight, weight_unit, location,
    bait_used, method, time_of_day, conditions, session_id,
    species, image_url, title, description, video_url, tags,
```

**Updated:**
```typescript
const { data, error } = await supabase
  .from("catches")
  .select(`
    id, created_at, caught_at, weight, weight_unit,
    location_label, normalized_location, bait_used, method_tag,
    equipment_used, time_of_day, conditions, session_id,
    species_slug, custom_species, species_id, venue_id,
    image_url, title, description, video_url, tags, gallery_photos,
    length, length_unit, visibility, hide_exact_spot, allow_ratings, deleted_at,
```

#### Change 2: Update CatchRow interface
**Location:** Top of file

**Current:**
```typescript
// Using Database types directly
```

**Add:**
```typescript
import type { Database } from "@/integrations/supabase/types";

type CatchRow = Database["public"]["Tables"]["catches"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// Helper type for catches with profile
export interface CatchWithProfile extends CatchRow {
  profiles: ProfileRow;
}
```

#### Change 3: Add filter for deleted catches
**Location:** Line 47

**Current:**
```typescript
.order("created_at", { ascending: false });
```

**Updated:**
```typescript
.is("deleted_at", null)  // Filter out soft-deleted catches
.order("created_at", { ascending: false });
```

### src/hooks/useCatches.ts

#### Change 1: Update interface and types
**Location:** Line 6-17

**Current:**
```typescript
interface CatchRow {
  id: string;
  title: string;
  species: string | null;
  location: string | null;
  image_url: string;
  created_at: string;
  caught_at: string | null;
  user_id: string;
  // ... etc
}
```

**Updated:**
```typescript
import type { Database } from "@/integrations/supabase/types";

type CatchRow = Database["public"]["Tables"]["catches"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface CatchWithProfile extends CatchRow {
  profiles: ProfileRow;
}
```

#### Change 2: Update SELECT query
**Location:** Line 32-35

**Current:**
```typescript
.select(`
  id, created_at, caught_at, weight, weight_unit, location,
  bait_used, method, time_of_day, conditions, session_id,
  species, image_url, title, description, video_url, tags,
```

**Updated:**
```typescript
.select(`
  id, created_at, caught_at, weight, weight_unit,
  location_label, normalized_location, bait_used, method_tag,
  equipment_used, time_of_day, conditions, session_id,
  species_slug, custom_species, species_id, venue_id,
  image_url, title, description, video_url, tags, gallery_photos,
  length, length_unit, visibility, hide_exact_spot, allow_ratings, deleted_at,
```

#### Change 3: Add soft delete filter
**Location:** After all WHERE clauses, before ORDER BY

**Add:**
```typescript
.is("deleted_at", null)
```

## Complete Unified Diffs

### src/lib/catches.ts
```diff
--- a/src/lib/catches.ts
+++ b/src/lib/catches.ts
@@ -1,6 +1,10 @@
 import { supabase } from "@/integrations/supabase/client";
 import type { Database } from "@/integrations/supabase/types";

+type CatchRow = Database["public"]["Tables"]["catches"]["Row"];
+type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
+
+export interface CatchWithProfile extends CatchRow { profiles: ProfileRow; }
+
 export const fetchCatches = async (userId?: string, limit = 50) => {
   const query = supabase
     .from("catches")
-    .select(`
-      id, created_at, caught_at, weight, weight_unit, location,
-      bait_used, method, time_of_day, conditions, session_id,
-      species, image_url, title, description, video_url, tags,
+    .select(`
+      id, created_at, caught_at, weight, weight_unit,
+      location_label, normalized_location, bait_used, method_tag,
+      equipment_used, time_of_day, conditions, session_id,
+      species_slug, custom_species, species_id, venue_id,
+      image_url, title, description, video_url, tags, gallery_photos,
+      length, length_unit, visibility, hide_exact_spot, allow_ratings, deleted_at,
       profiles!catches_user_id_fkey (
-        id, username, avatar_url
+        user_id, username, full_name, avatar_path, avatar_url
       )
     `)
+    .is("deleted_at", null)
     .order("created_at", { ascending: false });

   if (userId) {
```

### src/hooks/useCatches.ts
```diff
--- a/src/hooks/useCatches.ts
+++ b/src/hooks/useCatches.ts
@@ -3,22 +3,10 @@ import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/components/AuthProvider";
 import type { Database } from "@/integrations/supabase/types";

-interface CatchRow {
-  id: string;
-  title: string;
-  species: string | null;
-  location: string | null;
-  image_url: string;
-  created_at: string;
-  caught_at: string | null;
-  user_id: string;
-  profiles: {
-    id: string;
-    username: string;
-    avatar_url: string | null;
-  };
-}
+type CatchRow = Database["public"]["Tables"]["catches"]["Row"];
+type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

+interface CatchWithProfile extends CatchRow { profiles: ProfileRow; }

 export const useCatches = (feedType: "all" | "following" | "own" = "all") => {
   const { user } = useAuth();
@@ -30,10 +18,12 @@ export const useCatches = (feedType: "all" | "following" | "own" = "all") => {
     const query = supabase
       .from("catches")
       .select(`
-        id, created_at, caught_at, weight, weight_unit, location,
-        bait_used, method, time_of_day, conditions, session_id,
-        species, image_url, title, description, video_url, tags,
-        profiles!catches_user_id_fkey (id, username, avatar_url)
+        id, created_at, caught_at, weight, weight_unit,
+        location_label, normalized_location, bait_used, method_tag,
+        equipment_used, time_of_day, conditions, session_id,
+        species_slug, custom_species, species_id, venue_id,
+        image_url, title, description, video_url, tags, gallery_photos,
+        length, length_unit, visibility, hide_exact_spot, allow_ratings, deleted_at,
+        profiles!catches_user_id_fkey (user_id, username, full_name, avatar_path, avatar_url)
       `);

     if (feedType === "own" && user) {
@@ -50,6 +40,7 @@ export const useCatches = (feedType: "all" | "following" | "own" = "all") => {
       }
     }

+    query.is("deleted_at", null);
     query.order("created_at", { ascending: false });
     query.limit(50);

```

## Display Layer Updates

### Accessing Species Name
**Old:**
```typescript
catch.species
```

**New:**
```typescript
catch.species_slug || catch.custom_species || "Unknown"
```

### Accessing Location
**Old:**
```typescript
catch.location
```

**New:**
```typescript
catch.location_label || catch.normalized_location
```

### Accessing Method
**Old:**
```typescript
catch.method
```

**New:**
```typescript
catch.method_tag || "Unknown method"
```

## Breaking Changes

1. **Field Renames:**
   - `species` → `species_slug` + `custom_species`
   - `location` → `location_label` + `normalized_location`
   - `method` → `method_tag`

2. **New Required Filters:**
   - Must filter `deleted_at IS NULL` to exclude soft-deleted catches

3. **Type Changes:**
   - `conditions` upgraded from `JSON` to `JSONB`
   - `tags` is now `TEXT[]` instead of single string

## Testing Recommendations

1. **Feed Display**
   - ✓ Verify all catches display correctly
   - ✓ Test species names show properly (slug vs custom)
   - ✓ Test location display with new field names
   - ✓ Verify soft-deleted catches are hidden

2. **Filtering**
   - ✓ Test species filtering with species_slug
   - ✓ Test location filtering with normalized_location
   - ✓ Test method filtering with method_tag

3. **Edge Cases**
   - ✓ Catches without species_slug (use custom_species)
   - ✓ Catches without location_label
   - ✓ Catches with deleted_at set (should be hidden)

## Notes

- The new schema uses foreign keys to `species`, `venues`, and `sessions` tables
- `species_slug` is denormalized for performance (avoids JOIN on every query)
- `normalized_location` is case-insensitive for better search/grouping
- Soft delete via `deleted_at` preserves data for moderation/recovery
- New fields like `gallery_photos`, `video_url`, `tags` support richer content

## Validation Checklist
- [ ] Update field names in all SELECT queries
- [ ] Add deleted_at filter to all catch queries
- [ ] Update TypeScript interfaces to use Database types
- [ ] Test species display (slug vs custom)
- [ ] Test location display (label vs normalized)
- [ ] Verify soft-deleted catches are hidden
- [ ] Update any catch display components
