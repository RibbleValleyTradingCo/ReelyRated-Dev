# ReelyRated V2 Type System

This directory contains the complete TypeScript type definitions for ReelyRated V2, split into two complementary files that work together.

## File Structure

```
src/types/
├── database.ts    # Raw database row types (matches SQL schema exactly)
├── domain.ts      # Clean app-level types + conversion utilities
└── README.md      # This file
```

## `database.ts` - Database Layer

**Purpose:** Raw database types that match the SQL schema exactly.

**When to use:**
- Direct Supabase queries
- Database migrations
- When you need to know exact column names
- Type-checking Supabase query responses

**Key exports:**
```typescript
import type {
  Database,          // Main database type structure
  Tables,            // Helper: Tables<'catches'> = CatchRow
  Enums,             // Helper: Enums<'visibility_type'> = VisibilityType
  ProfileRow,        // Raw profile database row
  CatchRow,          // Raw catch database row
  ProfileInsert,     // Type for INSERT operations
  CatchUpdate,       // Type for UPDATE operations
  // ... and many more
} from '@/types/database';
```

**Example usage:**
```typescript
// Supabase query - returns database rows
const { data, error } = await supabase
  .from('catches')
  .select('*')
  .eq('user_id', userId);

// data is CatchRow[] (snake_case field names)
if (data) {
  console.log(data[0].species_slug); // ✅ snake_case
  console.log(data[0].speciesSlug);  // ❌ TypeScript error
}

// Insert operation
const newCatch: CatchInsert = {
  user_id: userId,
  image_url: photoUrl,
  title: 'Beautiful Mirror Carp',
  caught_at: new Date().toISOString(),
  species_slug: 'mirror_carp',
  weight: 15.5,
  weight_unit: 'lb_oz',
  // ... other fields
};
```

## `domain.ts` - Application Layer

**Purpose:** Clean, camelCase types for your application logic.

**When to use:**
- React components
- Business logic
- State management
- Forms and UI
- Anywhere in your app code (outside of Supabase queries)

**Key exports:**
```typescript
import type {
  // Clean domain models
  Profile,
  Catch,
  Session,
  Comment,
  Notification,

  // Joined types
  CatchWithProfile,
  CatchWithStats,
  CommentWithUser,
  ProfileWithStats,

  // View types
  LeaderboardEntry,
  FeedItem,

  // Form types
  CreateCatchData,
  UpdateCatchData,
  CreateSessionData,
  UpdateProfileData,

  // Query types
  CatchFilters,
  CatchQueryOptions,
  LeaderboardFilters,

  // Conversion utilities
  catchFromRow,
  profileFromRow,
  sessionFromRow,

  // Type guards
  isPublicCatch,
  isCatchVisibleTo,
  canUserPost,
} from '@/types/domain';
```

**Example usage:**
```typescript
// Component receives clean domain types
interface CatchCardProps {
  catch: CatchWithProfile;
  onReact: (reactionType: ReactionType) => void;
}

function CatchCard({ catch, onReact }: CatchCardProps) {
  return (
    <div>
      <h2>{catch.title}</h2>               {/* ✅ camelCase */}
      <p>By @{catch.profile.username}</p>
      <img src={catch.imageUrl} />
      <p>Weight: {catch.weight} {catch.weightUnit}</p>
    </div>
  );
}
```

## Two-Layer Pattern: Database → Domain

The recommended pattern is to convert database rows to domain types at the data fetching boundary:

```typescript
// ❌ BAD: Mixing snake_case database types in components
function MyComponent() {
  const [catches, setCatches] = useState<CatchRow[]>([]);

  return catches.map(c => (
    <div key={c.id}>{c.species_slug}</div> // snake_case in UI :(
  ));
}

// ✅ GOOD: Convert at the boundary
import { catchFromRow } from '@/types/domain';

async function fetchCatches(): Promise<Catch[]> {
  const { data } = await supabase
    .from('catches')
    .select('*');

  // Convert database rows to domain types
  return data ? data.map(catchFromRow) : [];
}

function MyComponent() {
  const [catches, setCatches] = useState<Catch[]>([]);

  useEffect(() => {
    fetchCatches().then(setCatches);
  }, []);

  return catches.map(c => (
    <div key={c.id}>{c.speciesSlug}</div> // ✅ camelCase in UI
  ));
}
```

## Common Patterns

### 1. Fetching and Displaying Catches

```typescript
import { supabase } from '@/lib/supabase';
import { catchFromRow, profileFromRow } from '@/types/domain';
import type { CatchWithProfile } from '@/types/domain';
import type { CatchRow, ProfileRow } from '@/types/database';

async function fetchCatchesWithProfiles(): Promise<CatchWithProfile[]> {
  // Query with join
  const { data, error } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles!user_id(*)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  if (!data) return [];

  // Convert to domain types
  return data.map(row => {
    const catch_ = catchFromRow(row as CatchRow);
    const profile = profileFromRow(row.profile as ProfileRow);
    return { ...catch_, profile };
  });
}
```

### 2. Creating a Catch (Form Submission)

```typescript
import type { CreateCatchData } from '@/types/domain';
import type { CatchInsert } from '@/types/database';

async function createCatch(data: CreateCatchData, userId: string) {
  // Convert domain form data to database insert type
  const insert: CatchInsert = {
    user_id: userId,
    image_url: data.imageUrl,
    title: data.title,
    caught_at: data.caughtAt.toISOString(),
    species_slug: data.speciesSlug,
    custom_species: data.customSpecies,
    weight: data.weight,
    weight_unit: data.weightUnit || 'lb_oz',
    length: data.length,
    length_unit: data.lengthUnit || 'cm',
    location_label: data.locationLabel,
    water_type_code: data.waterTypeCode,
    bait_used: data.baitUsed,
    method_tag: data.methodTag,
    equipment_used: data.equipmentUsed,
    time_of_day: data.timeOfDay,
    conditions: data.conditions || {},
    tags: data.tags || [],
    gallery_photos: data.galleryPhotos || [],
    video_url: data.videoUrl,
    visibility: data.visibility || 'public',
    hide_exact_spot: data.hideExactSpot || false,
    allow_ratings: data.allowRatings !== false,
  };

  const { data: result, error } = await supabase
    .from('catches')
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return catchFromRow(result as CatchRow);
}
```

### 3. Filtering Catches

```typescript
import type { CatchFilters, CatchQueryOptions } from '@/types/domain';

async function queryCatches(options: CatchQueryOptions) {
  let query = supabase
    .from('catches')
    .select('*, profile:profiles!user_id(*)');

  // Apply filters
  if (options.filters?.speciesSlug) {
    query = query.eq('species_slug', options.filters.speciesSlug);
  }
  if (options.filters?.normalizedLocation) {
    query = query.eq('normalized_location', options.filters.normalizedLocation);
  }
  if (options.filters?.minWeight) {
    query = query.gte('weight', options.filters.minWeight);
  }
  if (options.filters?.dateFrom) {
    query = query.gte('caught_at', options.filters.dateFrom);
  }

  // Apply sorting
  const sortBy = options.sortBy || 'created_at';
  query = query.order(sortBy, { ascending: false });

  // Apply pagination
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  // Convert to domain types
  return data.map(row => ({
    ...catchFromRow(row as CatchRow),
    profile: profileFromRow(row.profile as ProfileRow),
  }));
}

// Usage in component
const catches = await queryCatches({
  filters: {
    speciesSlug: 'mirror_carp',
    minWeight: 10,
    visibility: 'public',
  },
  sortBy: 'weight',
  limit: 10,
});
```

### 4. Leaderboard Queries

```typescript
import type { LeaderboardEntry, LeaderboardQueryOptions } from '@/types/domain';

async function fetchLeaderboard(options: LeaderboardQueryOptions): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('leaderboard_scores_mv') // Use materialized view for performance
    .select('*');

  // Apply filters
  if (options.filters?.speciesSlug) {
    query = query.eq('species_slug', options.filters.speciesSlug);
  }
  if (options.filters?.normalizedLocation) {
    query = query.eq('normalized_location', options.filters.normalizedLocation);
  }

  // Apply sorting
  const sortBy = options.sortBy || 'total_score';
  query = query.order(sortBy, { ascending: false });

  // Apply pagination
  const limit = options.limit || 50;
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  // Convert to domain type
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    speciesSlug: row.species_slug,
    customSpecies: row.custom_species,
    weight: row.weight,
    weightUnit: row.weight_unit,
    length: row.length,
    lengthUnit: row.length_unit,
    imageUrl: row.image_url,
    galleryPhotos: row.gallery_photos,
    videoUrl: row.video_url,
    locationLabel: row.location_label,
    normalizedLocation: row.normalized_location,
    waterTypeCode: row.water_type_code,
    methodTag: row.method_tag,
    tags: row.tags,
    timeOfDay: row.time_of_day,
    caughtAt: new Date(row.caught_at),
    conditions: row.conditions,
    createdAt: new Date(row.created_at),
    visibility: row.visibility,
    ownerUsername: row.owner_username,
    ownerAvatarPath: row.owner_avatar_path,
    ownerAvatarUrl: row.owner_avatar_url,
    avgRating: row.avg_rating,
    ratingCount: row.rating_count,
    reactionCount: row.reaction_count,
    totalScore: row.total_score,
  }));
}
```

### 5. Using Type Guards

```typescript
import { isCatchVisibleTo, isProfileSuspended, canUserPost } from '@/types/domain';

function CatchList({ catches, currentUserId, followingIds }) {
  return catches
    .filter(catch_ =>
      isCatchVisibleTo(catch_, currentUserId, followingIds.includes(catch_.userId))
    )
    .map(catch_ => <CatchCard key={catch_.id} catch={catch_} />);
}

function PostButton({ userProfile }) {
  if (!canUserPost(userProfile)) {
    return <Alert>Your account is suspended</Alert>;
  }

  return <Button>Create Catch</Button>;
}
```

### 6. Form Types with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import type { CreateCatchData } from '@/types/domain';

function CreateCatchForm() {
  const { register, handleSubmit } = useForm<CreateCatchData>();

  const onSubmit = async (data: CreateCatchData) => {
    await createCatch(data, currentUserId);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} required />
      <input {...register('imageUrl')} required />
      <input {...register('weight')} type="number" step="0.01" />
      <select {...register('weightUnit')}>
        <option value="lb_oz">lb/oz</option>
        <option value="kg">kg</option>
      </select>
      {/* ... more fields */}
    </form>
  );
}
```

## Type Compatibility with Supabase

These types are designed to work alongside Supabase-generated types:

```typescript
// If you have Supabase-generated types
import type { Database as SupabaseDatabase } from '@/lib/database.types';

// Our types should align perfectly
import type { Database as CustomDatabase } from '@/types/database';

// Both should have the same structure
type CatchFromSupabase = SupabaseDatabase['public']['Tables']['catches']['Row'];
type CatchFromCustom = CustomDatabase['public']['Tables']['catches']['Row'];

// These should be compatible (structurally identical)
```

## Best Practices

1. **Always convert at the boundary** - Transform database rows to domain types immediately after fetching
2. **Use domain types in components** - Your UI should work with clean camelCase types
3. **Use database types for queries** - Keep snake_case for direct Supabase operations
4. **Type your forms with domain types** - Use `CreateCatchData`, `UpdateProfileData`, etc.
5. **Use type guards** - Leverage helpers like `isPublicCatch()` for runtime checks
6. **Keep JSONB typed** - Use `CatchConditions` interface for the conditions field

## Field Name Mapping Reference

Common database → domain field mappings:

| Database (snake_case)  | Domain (camelCase)    |
|------------------------|----------------------|
| `user_id`              | `userId`             |
| `species_slug`         | `speciesSlug`        |
| `location_label`       | `locationLabel`      |
| `normalized_location`  | `normalizedLocation` |
| `water_type_code`      | `waterTypeCode`      |
| `bait_used`            | `baitUsed`           |
| `method_tag`           | `methodTag`          |
| `equipment_used`       | `equipmentUsed`      |
| `time_of_day`          | `timeOfDay`          |
| `gallery_photos`       | `galleryPhotos`      |
| `video_url`            | `videoUrl`           |
| `hide_exact_spot`      | `hideExactSpot`      |
| `allow_ratings`        | `allowRatings`       |
| `caught_at`            | `caughtAt`           |
| `created_at`           | `createdAt`          |
| `updated_at`           | `updatedAt`          |
| `deleted_at`           | `deletedAt`          |

## Null Handling

All nullable fields are correctly typed:

```typescript
const catch: Catch = getCatch();

// TypeScript knows these can be null
catch.description;      // string | null ✅
catch.weight;          // number | null ✅
catch.sessionId;       // string | null ✅

// Required fields are not nullable
catch.title;           // string ✅
catch.imageUrl;        // string ✅
catch.caughtAt;        // Date ✅
```

## Enums and Union Types

All PostgreSQL enums are typed as TypeScript unions:

```typescript
import type { VisibilityType, ReactionType, NotificationType } from '@/types/database';

const visibility: VisibilityType = 'public';     // ✅
const reaction: ReactionType = 'fire';           // ✅
const notification: NotificationType = 'mention'; // ✅

// TypeScript will catch invalid values
const invalid: VisibilityType = 'secret';        // ❌ Type error
```

## Contributing

When the database schema changes:

1. Update `database.ts` to match the new SQL schema exactly
2. Update `domain.ts` to reflect any new fields or relationships
3. Update conversion functions (`catchFromRow`, etc.)
4. Update this README with new patterns if needed
5. Run TypeScript to catch any breaking changes in the app

## Questions?

- **"Should I use `CatchRow` or `Catch`?"** → Use `Catch` in components, `CatchRow` only for direct database operations
- **"How do I handle joins?"** → Use types like `CatchWithProfile` or create your own joined types
- **"Can I add custom fields to JSONB?"** → Yes, extend `CatchConditions` interface as needed
- **"What about Supabase-generated types?"** → These types are compatible and can work alongside them

---

**Generated for:** ReelyRated V2
**Schema version:** 20251116000000_v2_complete_rebuild
**Last updated:** 2025-11-16
