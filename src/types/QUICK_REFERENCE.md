# Type System Quick Reference

## Import Cheatsheet

```typescript
// Database types (snake_case) - for Supabase queries
import type {
  CatchRow,
  ProfileRow,
  SessionRow,
  CatchInsert,
  CatchUpdate,
} from '@/types/database';

// Domain types (camelCase) - for app logic
import type {
  Catch,
  Profile,
  Session,
  CatchWithProfile,
  CatchWithStats,
  CreateCatchData,
  UpdateCatchData,
} from '@/types/domain';

// Conversion utilities
import {
  catchFromRow,
  profileFromRow,
  sessionFromRow,
  isCatchVisibleTo,
  isPublicCatch,
} from '@/types/domain';
```

## Common Patterns

### Pattern 1: Fetch and Display
```typescript
async function getCatches() {
  const { data } = await supabase
    .from('catches')
    .select('*, profile:profiles!user_id(*)');

  return data.map(row => ({
    ...catchFromRow(row),
    profile: profileFromRow(row.profile),
  }));
}
```

### Pattern 2: Create Record
```typescript
const formData: CreateCatchData = {
  imageUrl: '...',
  title: 'My catch',
  caughtAt: new Date(),
};

const insert: CatchInsert = {
  user_id: userId,
  image_url: formData.imageUrl,
  title: formData.title,
  caught_at: formData.caughtAt.toISOString(),
  // ... map other fields
};

await supabase.from('catches').insert(insert);
```

### Pattern 3: Update Record
```typescript
const updates: UpdateCatchData = {
  title: 'New title',
  visibility: 'public',
};

const dbUpdate: CatchUpdate = {
  title: updates.title,
  visibility: updates.visibility,
};

await supabase.from('catches').update(dbUpdate).eq('id', catchId);
```

## Field Name Quick Map

| Database (snake_case)  | Domain (camelCase)    |
|------------------------|----------------------|
| `user_id`              | `userId`             |
| `species_slug`         | `speciesSlug`        |
| `location_label`       | `locationLabel`      |
| `water_type_code`      | `waterTypeCode`      |
| `caught_at`            | `caughtAt`           |
| `created_at`           | `createdAt`          |

## Type Decision Tree

```
Need to...
│
├─ Query Supabase?
│  └─ Use: CatchRow, ProfileRow, etc.
│
├─ Display in React?
│  └─ Use: Catch, Profile, etc.
│
├─ Create form?
│  └─ Use: CreateCatchData, CreateSessionData, etc.
│
├─ Update record?
│  └─ Use: UpdateCatchData, UpdateProfileData, etc.
│
└─ Need joined data?
   └─ Use: CatchWithProfile, CatchWithStats, etc.
```

## All Available Types

### Core Domain Types
- `Profile`
- `Species`
- `Venue`
- `Session`
- `Catch`
- `Comment`
- `Reaction`
- `Rating`
- `Notification`
- `Follow`

### Joined Types
- `CatchWithProfile`
- `CatchWithStats`
- `CommentWithUser`
- `SessionWithCount`
- `SessionWithCatches`
- `SessionWithFullCatches`
- `ProfileWithStats`
- `NotificationWithActor`
- `SpeciesWithStats`
- `VenueWithStats`

### Form Types
- `CreateCatchData`
- `UpdateCatchData`
- `CreateSessionData`
- `UpdateSessionData`
- `CreateCommentData`
- `UpdateProfileData`
- `CreateReportData`

### Query Types
- `CatchFilters`
- `CatchQueryOptions`
- `LeaderboardFilters`
- `LeaderboardQueryOptions`
- `PaginationOptions`

### View Types
- `LeaderboardEntry`
- `FeedItem`
- `RateLimitStatus`
- `UserRateLimits`

### Enums
- `VisibilityType` - 'public' | 'followers' | 'private'
- `WeightUnit` - 'kg' | 'lb_oz'
- `LengthUnit` - 'cm' | 'in'
- `TimeOfDay` - 'morning' | 'afternoon' | 'evening' | 'night'
- `ReactionType` - 'like' | 'love' | 'fire'
- `NotificationType` - 'new_follower' | 'new_comment' | etc.
- `ReportStatus` - 'open' | 'in_review' | 'resolved' | 'dismissed'
- `ModerationStatus` - 'active' | 'warned' | 'suspended' | 'banned'

## Utilities

### Conversion Functions
```typescript
catchFromRow(row: CatchRow): Catch
profileFromRow(row: ProfileRow): Profile
sessionFromRow(row: SessionRow): Session
commentFromRow(row: CatchCommentRow): Comment
reactionFromRow(row: CatchReactionRow): Reaction
ratingFromRow(row: RatingRow): Rating
notificationFromRow(row: NotificationRow): Notification
followFromRow(row: ProfileFollowRow): Follow
```

### Type Guards
```typescript
isPublicCatch(catch: Catch): boolean
isCatchVisibleTo(catch: Catch, userId: string | null, isFollowing: boolean): boolean
isProfileSuspended(profile: Profile): boolean
canUserPost(profile: Profile): boolean
```

## Remember

1. **Database types** = Raw SQL structure (snake_case)
2. **Domain types** = Clean app structure (camelCase)
3. **Convert at the boundary** = Fetch with database types, convert to domain types immediately
4. **Use domain types everywhere else** = React, hooks, state, props, forms

## Need Help?

- See `examples.ts` for 10 comprehensive examples
- See `README.md` for full documentation
- See `TYPE_SYSTEM_SUMMARY.md` for overview
