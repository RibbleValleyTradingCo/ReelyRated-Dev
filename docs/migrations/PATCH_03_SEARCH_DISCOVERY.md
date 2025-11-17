# PATCH 03: Search & Discovery Updates

## Overview
Updates search, filtering, and discovery features to align with the new schema structure.

## Files Affected
- Any search/filter components (to be identified)
- Feed filtering logic
- Species/location/method filtering

## Schema Changes Summary

### Key Search/Filter Field Changes

**catches table:**
```sql
-- Old fields
species TEXT (free text)
location TEXT (free text)
method TEXT (free text)

-- New fields
species_id UUID (FK to species catalog)
species_slug CITEXT (denormalized for fast filtering)
custom_species TEXT (for non-catalog species)
location_label TEXT (display name)
normalized_location CITEXT (case-insensitive for grouping)
method_tag TEXT (references tags table)
venue_id UUID (FK to venues catalog)
```

**New catalog tables:**
```sql
species (id, slug, common_name, scientific_name, category)
venues (id, slug, name, region, country, lat, long)
tags (slug, label, category, method_group)
baits (slug, label, category)
water_types (code, label, group_name)
```

## Search/Filter Strategy Updates

### Species Filtering

**Old Approach:**
```typescript
// Free-text species search
const filteredCatches = catches.filter(c =>
  c.species?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**New Approach:**
```typescript
// Use species_slug for exact matching, custom_species for free-text
const filteredCatches = catches.filter(c => {
  const speciesName = c.species_slug || c.custom_species;
  return speciesName?.toLowerCase().includes(searchTerm.toLowerCase());
});

// OR: Filter by species catalog
const catchesBySpecies = await supabase
  .from("catches")
  .select("*")
  .eq("species_slug", "mirror_carp")  // Case-insensitive CITEXT
  .is("deleted_at", null);
```

### Location Filtering

**Old Approach:**
```typescript
// Free-text location search
const byLocation = catches.filter(c =>
  c.location?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**New Approach:**
```typescript
// Use normalized_location for case-insensitive grouping
const byLocation = await supabase
  .from("catches")
  .select("*")
  .eq("normalized_location", searchTerm.toLowerCase())
  .is("deleted_at", null);

// Get unique locations for dropdown
const locations = await supabase
  .from("catches")
  .select("normalized_location")
  .not("normalized_location", "is", null)
  .is("deleted_at", null);

const uniqueLocations = [...new Set(locations.data?.map(c => c.normalized_location))];
```

### Method/Technique Filtering

**Old Approach:**
```typescript
// Free-text method
const byMethod = catches.filter(c => c.method === selectedMethod);
```

**New Approach:**
```typescript
// Use method_tag (references tags table)
const byMethod = await supabase
  .from("catches")
  .select("*")
  .eq("method_tag", selectedMethodTag)
  .is("deleted_at", null);

// Get available methods from tags catalog
const methods = await supabase
  .from("tags")
  .select("slug, label")
  .eq("category", "method")
  .order("label");
```

### Bait Filtering

**New Approach (Enhanced):**
```typescript
// Get available baits from catalog
const baits = await supabase
  .from("baits")
  .select("slug, label, category")
  .order("category", "label");

// Filter catches by bait (still free-text in catches table)
const byBait = catches.filter(c =>
  c.bait_used?.toLowerCase() === selectedBait.toLowerCase()
);
```

### Venue Filtering

**New Approach:**
```typescript
// Filter by venue catalog
const byVenue = await supabase
  .from("catches")
  .select(`
    *,
    venue:venue_id (
      id, slug, name, region, country
    )
  `)
  .eq("venue_id", venueId)
  .is("deleted_at", null);

// Get popular venues
const popularVenues = await supabase
  .from("venues")
  .select(`
    id, slug, name,
    catch_count:catches(count)
  `)
  .order("catch_count", { ascending: false })
  .limit(10);
```

## Required Component Updates

### Filter Dropdown Components

**Example: SpeciesFilter.tsx**
```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Species {
  slug: string;
  common_name: string;
  category: string;
}

export const SpeciesFilter = ({ onSelect }: { onSelect: (slug: string) => void }) => {
  const [species, setSpecies] = useState<Species[]>([]);

  useEffect(() => {
    const fetchSpecies = async () => {
      const { data } = await supabase
        .from("species")
        .select("slug, common_name, category")
        .order("common_name");

      if (data) setSpecies(data);
    };

    fetchSpecies();
  }, []);

  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="All species" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All species</SelectItem>
        {species.map((s) => (
          <SelectItem key={s.slug} value={s.slug}>
            {s.common_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

**Example: LocationFilter.tsx**
```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const LocationFilter = ({ onSelect }: { onSelect: (location: string) => void }) => {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      // Get unique locations from catches
      const { data } = await supabase
        .from("catches")
        .select("normalized_location")
        .not("normalized_location", "is", null)
        .is("deleted_at", null);

      if (data) {
        const unique = [...new Set(data.map(d => d.normalized_location))].sort();
        setLocations(unique);
      }
    };

    fetchLocations();
  }, []);

  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="All locations" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All locations</SelectItem>
        {locations.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

## Search Query Updates

### Full-Text Search (Future Enhancement)
```sql
-- Add GIN index for full-text search
CREATE INDEX idx_catches_search
ON catches
USING GIN (to_tsvector('english',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(species_slug, '') || ' ' ||
  coalesce(custom_species, '')
));

-- Search function
CREATE OR REPLACE FUNCTION search_catches(search_query TEXT)
RETURNS SETOF catches
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM catches
  WHERE deleted_at IS NULL
    AND to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(species_slug, '') || ' ' ||
      coalesce(custom_species, '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY created_at DESC;
$$;
```

### Combined Filter Query
```typescript
interface CatchFilters {
  speciesSlug?: string;
  location?: string;
  methodTag?: string;
  baitUsed?: string;
  venueId?: string;
  minWeight?: number;
  maxWeight?: number;
  dateFrom?: string;
  dateTo?: string;
}

const buildFilteredQuery = (filters: CatchFilters) => {
  let query = supabase
    .from("catches")
    .select("*")
    .is("deleted_at", null);

  if (filters.speciesSlug) {
    query = query.eq("species_slug", filters.speciesSlug);
  }

  if (filters.location) {
    query = query.eq("normalized_location", filters.location.toLowerCase());
  }

  if (filters.methodTag) {
    query = query.eq("method_tag", filters.methodTag);
  }

  if (filters.baitUsed) {
    query = query.ilike("bait_used", `%${filters.baitUsed}%`);
  }

  if (filters.venueId) {
    query = query.eq("venue_id", filters.venueId);
  }

  if (filters.minWeight) {
    query = query.gte("weight", filters.minWeight);
  }

  if (filters.maxWeight) {
    query = query.lte("weight", filters.maxWeight);
  }

  if (filters.dateFrom) {
    query = query.gte("caught_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("caught_at", filters.dateTo);
  }

  return query.order("caught_at", { ascending: false });
};
```

## Leaderboard Queries

### Species Leaderboard
```typescript
// Top catches for a specific species
const getSpeciesLeaderboard = async (speciesSlug: string) => {
  const { data } = await supabase
    .from("catches")
    .select(`
      id, title, weight, weight_unit, caught_at, image_url,
      profiles!catches_user_id_fkey (
        user_id, username, avatar_path, avatar_url
      )
    `)
    .eq("species_slug", speciesSlug)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .not("weight", "is", null)
    .order("weight", { ascending: false })
    .limit(100);

  return data;
};
```

### Location Leaderboard
```typescript
// Top catches at a location
const getLocationLeaderboard = async (location: string) => {
  const { data } = await supabase
    .from("catches")
    .select(`
      id, title, species_slug, custom_species, weight, weight_unit,
      caught_at, image_url,
      profiles!catches_user_id_fkey (
        user_id, username, avatar_path, avatar_url
      )
    `)
    .eq("normalized_location", location.toLowerCase())
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("weight", { ascending: false })
    .limit(50);

  return data;
};
```

### Popular Venues
```typescript
// Most active venues
const getPopularVenues = async () => {
  const { data } = await supabase
    .rpc("get_popular_venues", { limit_count: 20 });

  return data;
};

// RPC function:
// CREATE OR REPLACE FUNCTION get_popular_venues(limit_count INT DEFAULT 20)
// RETURNS TABLE (
//   venue_id UUID,
//   venue_name TEXT,
//   catch_count BIGINT
// )
// LANGUAGE sql
// STABLE
// AS $$
//   SELECT
//     venue_id,
//     venue_name_manual as venue_name,
//     COUNT(*) as catch_count
//   FROM catches
//   WHERE deleted_at IS NULL
//     AND visibility = 'public'
//     AND venue_name_manual IS NOT NULL
//   GROUP BY venue_id, venue_name_manual
//   ORDER BY catch_count DESC
//   LIMIT limit_count;
// $$;
```

## Breaking Changes

1. **Species Access:**
   - Old: `catch.species`
   - New: `catch.species_slug || catch.custom_species`

2. **Location Access:**
   - Old: `catch.location`
   - New: `catch.location_label || catch.normalized_location`

3. **Method Access:**
   - Old: `catch.method`
   - New: `catch.method_tag`

4. **Filtering:**
   - Must use new field names in WHERE clauses
   - Must add `deleted_at IS NULL` filter

5. **Catalog Integration:**
   - Species, venues, tags are now in separate tables
   - Can JOIN for rich data or use denormalized fields

## Testing Recommendations

1. **Species Filtering**
   - ✓ Test filtering by catalog species
   - ✓ Test filtering by custom species
   - ✓ Test case-insensitive matching
   - ✓ Verify deleted catches excluded

2. **Location Filtering**
   - ✓ Test location grouping (case-insensitive)
   - ✓ Test unique location extraction
   - ✓ Test partial location matching

3. **Method/Bait Filtering**
   - ✓ Test method tag filtering
   - ✓ Test bait filtering
   - ✓ Verify catalog data loads

4. **Combined Filters**
   - ✓ Test multiple filters together
   - ✓ Test filter clearing
   - ✓ Test empty results handling

5. **Leaderboards**
   - ✓ Test species leaderboards
   - ✓ Test location leaderboards
   - ✓ Test venue popularity rankings

## Notes

- Denormalized fields (`species_slug`, `normalized_location`) enable fast filtering without JOINs
- Catalog tables provide rich metadata and consistent data
- Case-insensitive CITEXT fields improve search/grouping
- Soft delete must be filtered in all discovery queries

## Future Enhancements

1. **Advanced Search:**
   - Full-text search across title, description, species
   - Fuzzy matching for species/location names
   - Search suggestions/autocomplete

2. **Saved Filters:**
   - Allow users to save filter combinations
   - Quick filter presets (e.g., "My PBs", "Last month")

3. **Trending/Popular:**
   - Most caught species this week
   - Trending locations
   - Popular techniques by season

4. **Map-Based Discovery:**
   - Venue clustering on map
   - Heatmap of catch locations
   - Nearby venues/catches

## Validation Checklist
- [ ] Update all species filtering to use species_slug
- [ ] Update all location filtering to use normalized_location
- [ ] Update all method filtering to use method_tag
- [ ] Add deleted_at filters to all discovery queries
- [ ] Create species/location/method filter components
- [ ] Implement catalog data loading
- [ ] Test combined filter queries
- [ ] Verify leaderboard queries work
- [ ] Test case-insensitive searching
- [ ] Document catalog table usage patterns
