/**
 * TYPE USAGE EXAMPLES - ReelyRated V2
 *
 * This file demonstrates common patterns for using the type system.
 * These are runnable examples you can reference when building features.
 *
 * NOT MEANT TO BE IMPORTED - just reference/documentation
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Database,
  CatchRow,
  CatchInsert,
  CatchUpdate,
  ProfileRow,
  SessionRow,
} from './database';

import type {
  Catch,
  CatchWithProfile,
  CatchWithStats,
  CreateCatchData,
  UpdateCatchData,
  CatchFilters,
  CatchQueryOptions,
  LeaderboardEntry,
  Profile,
} from './domain';

import {
  catchFromRow,
  profileFromRow,
  sessionFromRow,
  isCatchVisibleTo,
  isPublicCatch,
} from './domain';

// ============================================================================
// EXAMPLE 1: Fetch catches with profiles (most common pattern)
// ============================================================================

export async function fetchPublicCatches(): Promise<CatchWithProfile[]> {
  // Query with join
  const { data, error } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles!user_id(*)
    `)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  if (!data) return [];

  // Convert database rows to domain types
  return data.map((row) => {
    const catch_ = catchFromRow(row as CatchRow);
    const profile = profileFromRow(row.profile as ProfileRow);
    return {
      ...catch_,
      profile,
    };
  });
}

// ============================================================================
// EXAMPLE 2: Create a new catch (form submission)
// ============================================================================

export async function createNewCatch(
  formData: CreateCatchData,
  userId: string
): Promise<Catch> {
  // Convert domain form data to database insert type
  const insert: CatchInsert = {
    user_id: userId,
    session_id: formData.sessionId,
    venue_id: formData.venueId,
    species_id: formData.speciesId,

    // Required fields
    image_url: formData.imageUrl,
    title: formData.title,
    caught_at: formData.caughtAt.toISOString(),

    // Optional fields
    description: formData.description,
    species_slug: formData.speciesSlug,
    custom_species: formData.customSpecies,
    weight: formData.weight,
    weight_unit: formData.weightUnit || 'lb_oz',
    length: formData.length,
    length_unit: formData.lengthUnit || 'cm',
    location_label: formData.locationLabel,
    water_type_code: formData.waterTypeCode,
    bait_used: formData.baitUsed,
    method_tag: formData.methodTag,
    equipment_used: formData.equipmentUsed,
    time_of_day: formData.timeOfDay,
    conditions: formData.conditions || {},
    tags: formData.tags || [],
    gallery_photos: formData.galleryPhotos || [],
    video_url: formData.videoUrl,
    visibility: formData.visibility || 'public',
    hide_exact_spot: formData.hideExactSpot || false,
    allow_ratings: formData.allowRatings !== false,
  };

  const { data, error } = await supabase
    .from('catches')
    .insert(insert)
    .select()
    .single();

  if (error) throw error;

  // Convert database row to domain type
  return catchFromRow(data as CatchRow);
}

// ============================================================================
// EXAMPLE 3: Update a catch (limited fields allowed)
// ============================================================================

export async function updateCatch(
  catchId: string,
  updates: UpdateCatchData
): Promise<Catch> {
  // Convert domain update to database update
  const dbUpdate: CatchUpdate = {
    title: updates.title,
    description: updates.description,
    visibility: updates.visibility,
    hide_exact_spot: updates.hideExactSpot,
    allow_ratings: updates.allowRatings,
  };

  const { data, error } = await supabase
    .from('catches')
    .update(dbUpdate)
    .eq('id', catchId)
    .select()
    .single();

  if (error) throw error;

  return catchFromRow(data as CatchRow);
}

// ============================================================================
// EXAMPLE 4: Advanced filtering with type-safe options
// ============================================================================

export async function queryCatchesAdvanced(
  options: CatchQueryOptions
): Promise<CatchWithProfile[]> {
  let query = supabase
    .from('catches')
    .select(`
      *,
      profile:profiles!user_id(*)
    `);

  // Apply filters with type safety
  const filters = options.filters;
  if (filters) {
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.speciesSlug) {
      query = query.eq('species_slug', filters.speciesSlug);
    }
    if (filters.normalizedLocation) {
      query = query.eq('normalized_location', filters.normalizedLocation);
    }
    if (filters.waterTypeCode) {
      query = query.eq('water_type_code', filters.waterTypeCode);
    }
    if (filters.methodTag) {
      query = query.eq('method_tag', filters.methodTag);
    }
    if (filters.minWeight !== undefined) {
      query = query.gte('weight', filters.minWeight);
    }
    if (filters.maxWeight !== undefined) {
      query = query.lte('weight', filters.maxWeight);
    }
    if (filters.dateFrom) {
      query = query.gte('caught_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('caught_at', filters.dateTo);
    }
    if (filters.visibility) {
      if (Array.isArray(filters.visibility)) {
        query = query.in('visibility', filters.visibility);
      } else {
        query = query.eq('visibility', filters.visibility);
      }
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.hasVideo !== undefined) {
      query = filters.hasVideo
        ? query.not('video_url', 'is', null)
        : query.is('video_url', null);
    }
  }

  // Apply sorting
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'created_at':
        query = query.order('created_at', { ascending: false });
        break;
      case 'caught_at':
        query = query.order('caught_at', { ascending: false });
        break;
      case 'weight':
        query = query.order('weight', { ascending: false, nullsFirst: false });
        break;
      // Note: 'rating' and 'reactions' sorting would need joins to aggregate tables
      default:
        query = query.order('created_at', { ascending: false });
    }
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Include deleted if specified
  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    ...catchFromRow(row as CatchRow),
    profile: profileFromRow(row.profile as ProfileRow),
  }));
}

// ============================================================================
// EXAMPLE 5: Fetch catch with all stats (reactions, comments, ratings)
// ============================================================================

export async function fetchCatchWithStats(
  catchId: string,
  currentUserId?: string
): Promise<CatchWithStats | null> {
  // Fetch catch with profile
  const { data: catchData, error: catchError } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles!user_id(*)
    `)
    .eq('id', catchId)
    .single();

  if (catchError) throw catchError;
  if (!catchData) return null;

  // Fetch reaction count
  const { count: reactionCount } = await supabase
    .from('catch_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('catch_id', catchId);

  // Fetch comment count (non-deleted only)
  const { count: commentCount } = await supabase
    .from('catch_comments')
    .select('*', { count: 'exact', head: true })
    .eq('catch_id', catchId)
    .is('deleted_at', null);

  // Fetch rating stats
  const { data: ratingData } = await supabase
    .from('ratings')
    .select('rating')
    .eq('catch_id', catchId);

  const ratingCountValue = ratingData?.length || 0;
  const avgRating = ratingData && ratingData.length > 0
    ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length
    : null;

  // Fetch current user's reaction (if logged in)
  let userReaction = null;
  if (currentUserId) {
    const { data: reactionData } = await supabase
      .from('catch_reactions')
      .select('reaction')
      .eq('catch_id', catchId)
      .eq('user_id', currentUserId)
      .maybeSingle();

    userReaction = reactionData?.reaction || null;
  }

  // Fetch current user's rating (if logged in)
  let userRating = null;
  if (currentUserId) {
    const { data: ratingData } = await supabase
      .from('ratings')
      .select('rating')
      .eq('catch_id', catchId)
      .eq('user_id', currentUserId)
      .maybeSingle();

    userRating = ratingData?.rating || null;
  }

  // Combine everything
  return {
    ...catchFromRow(catchData as CatchRow),
    profile: profileFromRow(catchData.profile as ProfileRow),
    reactionCount: reactionCount || 0,
    commentCount: commentCount || 0,
    ratingCount: ratingCountValue,
    avgRating,
    userReaction,
    userRating,
  };
}

// ============================================================================
// EXAMPLE 6: Leaderboard query with filters
// ============================================================================

export async function fetchLeaderboard(
  filters?: {
    speciesSlug?: string;
    normalizedLocation?: string;
    limit?: number;
  }
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('leaderboard_scores_mv')
    .select('*');

  if (filters?.speciesSlug) {
    query = query.eq('species_slug', filters.speciesSlug);
  }
  if (filters?.normalizedLocation) {
    query = query.eq('normalized_location', filters.normalizedLocation);
  }

  query = query
    .order('total_score', { ascending: false })
    .limit(filters?.limit || 50);

  const { data, error } = await query;
  if (error) throw error;

  // Convert to LeaderboardEntry type
  return (data || []).map((row) => ({
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

// ============================================================================
// EXAMPLE 7: User profile with stats
// ============================================================================

export async function fetchUserProfileWithStats(
  username: string,
  currentUserId?: string
) {
  // Fetch profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError) throw profileError;
  if (!profileData) return null;

  const profile = profileFromRow(profileData as ProfileRow);

  // Fetch follower count
  const { count: followerCount } = await supabase
    .from('profile_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.userId);

  // Fetch following count
  const { count: followingCount } = await supabase
    .from('profile_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.userId);

  // Fetch catch count
  const { count: catchCount } = await supabase
    .from('catches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.userId)
    .eq('visibility', 'public')
    .is('deleted_at', null);

  // Check if current user is following this profile
  let isFollowing = false;
  let isFollower = false;
  if (currentUserId && currentUserId !== profile.userId) {
    const { data: followingData } = await supabase
      .from('profile_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', profile.userId)
      .maybeSingle();

    isFollowing = !!followingData;

    const { data: followerData } = await supabase
      .from('profile_follows')
      .select('id')
      .eq('follower_id', profile.userId)
      .eq('following_id', currentUserId)
      .maybeSingle();

    isFollower = !!followerData;
  }

  return {
    ...profile,
    followerCount: followerCount || 0,
    followingCount: followingCount || 0,
    catchCount: catchCount || 0,
    isFollowing,
    isFollower,
  };
}

// ============================================================================
// EXAMPLE 8: Using type guards for visibility checks
// ============================================================================

export async function fetchVisibleCatches(
  currentUserId: string | null,
  followingIds: string[]
): Promise<CatchWithProfile[]> {
  // Fetch all catches (let client filter by visibility)
  const allCatches = await fetchPublicCatches();

  // Filter using type guard
  return allCatches.filter((catch_) => {
    // Check if catch is visible to current user
    const isFollowing = followingIds.includes(catch_.userId);
    return isCatchVisibleTo(catch_, currentUserId, isFollowing);
  });
}

// ============================================================================
// EXAMPLE 9: React Hook Form with domain types
// ============================================================================

/*
import { useForm } from 'react-hook-form';

function CreateCatchFormExample() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateCatchData>();

  const onSubmit = async (data: CreateCatchData) => {
    try {
      const newCatch = await createNewCatch(data, currentUserId);
      console.log('Created catch:', newCatch);
    } catch (error) {
      console.error('Failed to create catch:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('title', { required: true })}
        placeholder="Catch title"
      />
      {errors.title && <span>Title is required</span>}

      <input
        {...register('imageUrl', { required: true })}
        placeholder="Image URL"
      />
      {errors.imageUrl && <span>Image is required</span>}

      <input
        {...register('weight', { valueAsNumber: true })}
        type="number"
        step="0.01"
        placeholder="Weight"
      />

      <select {...register('weightUnit')}>
        <option value="lb_oz">lb/oz</option>
        <option value="kg">kg</option>
      </select>

      <input
        {...register('speciesSlug')}
        placeholder="Species (e.g., mirror_carp)"
      />

      <textarea
        {...register('description')}
        placeholder="Description..."
      />

      <button type="submit">Create Catch</button>
    </form>
  );
}
*/

// ============================================================================
// EXAMPLE 10: React component props with domain types
// ============================================================================

/*
import type { CatchWithProfile, ReactionType } from '@/types/domain';

interface CatchCardProps {
  catch: CatchWithProfile;
  onReact: (catchId: string, reaction: ReactionType) => void;
  onComment: (catchId: string) => void;
}

function CatchCard({ catch, onReact, onComment }: CatchCardProps) {
  return (
    <div className="catch-card">
      <div className="catch-header">
        <img src={catch.profile.avatarUrl || '/default-avatar.png'} alt="" />
        <span>@{catch.profile.username}</span>
      </div>

      <img src={catch.imageUrl} alt={catch.title} />

      <h3>{catch.title}</h3>
      {catch.description && <p>{catch.description}</p>}

      {catch.weight && (
        <p>Weight: {catch.weight} {catch.weightUnit}</p>
      )}

      {catch.speciesSlug && (
        <p>Species: {catch.speciesSlug.replace('_', ' ')}</p>
      )}

      <div className="actions">
        <button onClick={() => onReact(catch.id, 'like')}>Like</button>
        <button onClick={() => onReact(catch.id, 'love')}>Love</button>
        <button onClick={() => onReact(catch.id, 'fire')}>Fire</button>
        <button onClick={() => onComment(catch.id)}>Comment</button>
      </div>
    </div>
  );
}
*/
