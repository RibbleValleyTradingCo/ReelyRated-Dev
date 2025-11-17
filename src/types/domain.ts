/**
 * DOMAIN TYPES - ReelyRated V2
 *
 * Clean, app-level types that the frontend uses.
 * These build on top of database.ts and add:
 * - Joined data types (e.g., CatchWithProfile)
 * - View types (e.g., LeaderboardEntry)
 * - Form types
 * - Helper utilities
 *
 * Usage:
 *   import type { Catch, CatchWithProfile, CreateCatchData } from '@/types/domain'
 */

import type {
  ProfileRow,
  SpeciesRow,
  VenueRow,
  SessionRow,
  CatchRow,
  CatchCommentRow,
  CatchReactionRow,
  RatingRow,
  NotificationRow,
  ReportRow,
  ProfileFollowRow,
  UserWarningRow,
  ModerationLogRow,
  VisibilityType,
  WeightUnit,
  LengthUnit,
  TimeOfDay,
  NotificationType,
  ReactionType,
  ReportStatus,
  ModerationStatus,
  WarningSeverity,
} from './database';

// ============================================================================
// CLEAN DOMAIN MODELS
// ============================================================================

/**
 * User Profile (clean version)
 */
export interface Profile {
  userId: string;
  username: string;
  fullName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  warnCount: number;
  moderationStatus: ModerationStatus;
  suspensionUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Species (clean version)
 */
export interface Species {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string | null;
  category: string | null;
  recordWeight: number | null;
  recordWeightUnit: WeightUnit | null;
  imageUrl: string | null;
  createdAt: Date;
}

/**
 * Venue (clean version)
 */
export interface Venue {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session (clean version)
 */
export interface Session {
  id: string;
  userId: string;
  venueId: string | null;
  title: string;
  venueNameManual: string | null;
  date: string | null; // YYYY-MM-DD
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Catch conditions (typed JSONB content)
 */
export interface CatchConditions {
  // Weather
  weather?: 'sunny' | 'overcast' | 'raining' | 'windy' | 'stormy' | string;
  temperature?: number; // Celsius
  temperatureUnit?: 'C' | 'F';

  // Water
  waterClarity?: 'clear' | 'coloured' | 'murky';
  waterTemp?: number;

  // Wind
  windSpeed?: number;
  windDirection?: string; // e.g., 'N', 'NE', 'SW'

  // Pressure
  airPressure?: number; // millibars
  pressureTrend?: 'rising' | 'falling' | 'steady';

  // Moon phase (some anglers track this)
  moonPhase?: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' |
              'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

  // GPS coordinates (if user allows)
  latitude?: number;
  longitude?: number;

  // Allow custom fields
  [key: string]: unknown;
}

/**
 * Catch (clean version)
 */
export interface Catch {
  id: string;
  userId: string;
  sessionId: string | null;
  venueId: string | null;
  speciesId: string | null;

  // Required fields
  imageUrl: string;
  title: string;
  caughtAt: Date;

  // Optional descriptive fields
  description: string | null;
  speciesSlug: string | null;
  customSpecies: string | null;

  // Fish measurements
  weight: number | null;
  weightUnit: WeightUnit | null;
  length: number | null;
  lengthUnit: LengthUnit | null;

  // Location details
  locationLabel: string | null;
  normalizedLocation: string | null;
  waterTypeCode: string | null;

  // Tactics/Method
  baitUsed: string | null;
  methodTag: string | null;
  equipmentUsed: string | null;

  // Timing
  timeOfDay: TimeOfDay | null;

  // Flexible data
  conditions: CatchConditions;
  tags: string[];
  galleryPhotos: string[];
  videoUrl: string | null;

  // Privacy settings
  visibility: VisibilityType;
  hideExactSpot: boolean;
  allowRatings: boolean;

  // Soft delete & timestamps
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comment (clean version)
 */
export interface Comment {
  id: string;
  catchId: string;
  userId: string;
  body: string;
  mentionedUsernames: string[];
  deletedAt: Date | null;
  createdAt: Date;
}

/**
 * Reaction (clean version)
 */
export interface Reaction {
  catchId: string;
  userId: string;
  reaction: ReactionType;
  createdAt: Date;
}

/**
 * Rating (clean version)
 */
export interface Rating {
  catchId: string;
  userId: string;
  rating: number; // 1-10
  createdAt: Date;
}

/**
 * Notification (clean version)
 */
export interface Notification {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  message: string;
  catchId: string | null;
  commentId: string | null;
  extraData: Record<string, unknown>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Follow relationship (clean version)
 */
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// ============================================================================
// JOINED/EXTENDED TYPES
// ============================================================================

/**
 * Catch with owner profile information
 */
export interface CatchWithProfile extends Catch {
  profile: Profile;
}

/**
 * Catch with all social stats
 */
export interface CatchWithStats extends Catch {
  profile: Profile;
  reactionCount: number;
  commentCount: number;
  ratingCount: number;
  avgRating: number | null;
  userReaction: ReactionType | null; // Current user's reaction, if any
  userRating: number | null; // Current user's rating, if any
}

/**
 * Comment with commenter profile
 */
export interface CommentWithUser extends Comment {
  profile: Profile;
}

/**
 * Session with catch count
 */
export interface SessionWithCount extends Session {
  catchCount: number;
}

/**
 * Session with all catches
 */
export interface SessionWithCatches extends Session {
  catches: Catch[];
}

/**
 * Session with catches and profiles
 */
export interface SessionWithFullCatches extends Session {
  catches: CatchWithProfile[];
}

/**
 * Profile with follower/following counts
 */
export interface ProfileWithStats extends Profile {
  followerCount: number;
  followingCount: number;
  catchCount: number;
  isFollowing?: boolean; // From perspective of current user
  isFollower?: boolean; // From perspective of current user
}

/**
 * Notification with actor profile
 */
export interface NotificationWithActor extends Notification {
  actor: Profile | null;
}

/**
 * Species with catch count (for popular species list)
 */
export interface SpeciesWithStats extends Species {
  catchCount: number;
  avgWeight: number | null;
  maxWeight: number | null;
}

/**
 * Venue with catch count (for popular venues list)
 */
export interface VenueWithStats extends Venue {
  catchCount: number;
  topSpecies: string[]; // Array of species slugs
}

// ============================================================================
// LEADERBOARD & VIEW TYPES
// ============================================================================

/**
 * Leaderboard entry (matches the leaderboard_scores_detailed view)
 */
export interface LeaderboardEntry {
  // Catch details
  id: string;
  userId: string;
  title: string;
  description: string | null;
  speciesSlug: string | null;
  customSpecies: string | null;
  weight: number | null;
  weightUnit: WeightUnit | null;
  length: number | null;
  lengthUnit: LengthUnit | null;
  imageUrl: string;
  galleryPhotos: string[];
  videoUrl: string | null;
  locationLabel: string | null;
  normalizedLocation: string | null;
  waterTypeCode: string | null;
  methodTag: string | null;
  tags: string[];
  timeOfDay: TimeOfDay | null;
  caughtAt: Date;
  conditions: CatchConditions;
  createdAt: Date;
  visibility: VisibilityType;

  // Owner profile
  ownerUsername: string;
  ownerAvatarPath: string | null;
  ownerAvatarUrl: string | null;

  // Aggregates
  avgRating: number; // NUMERIC(4,2)
  ratingCount: number;
  reactionCount: number;

  // Scoring
  totalScore: number; // weight + (avg_rating * 5) + (reaction_count * 0.5)
}

/**
 * Feed item (for home feed with mixed content)
 */
export interface FeedItem {
  type: 'catch' | 'session';
  id: string;
  userId: string;
  username: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  content: CatchWithStats | SessionWithFullCatches;
}

// ============================================================================
// FORM TYPES (for creating/updating)
// ============================================================================

/**
 * Data for creating a new catch
 */
export interface CreateCatchData {
  // Required
  imageUrl: string;
  title: string;
  caughtAt: Date;

  // Optional session link
  sessionId?: string | null;

  // Species (either ID, slug, or custom)
  speciesId?: string | null;
  speciesSlug?: string | null;
  customSpecies?: string | null;

  // Venue
  venueId?: string | null;

  // Description
  description?: string | null;

  // Measurements
  weight?: number | null;
  weightUnit?: WeightUnit;
  length?: number | null;
  lengthUnit?: LengthUnit;

  // Location
  locationLabel?: string | null;
  waterTypeCode?: string | null;

  // Tactics
  baitUsed?: string | null;
  methodTag?: string | null;
  equipmentUsed?: string | null;

  // Timing
  timeOfDay?: TimeOfDay | null;

  // Flexible
  conditions?: CatchConditions;
  tags?: string[];
  galleryPhotos?: string[];
  videoUrl?: string | null;

  // Privacy
  visibility?: VisibilityType;
  hideExactSpot?: boolean;
  allowRatings?: boolean;
}

/**
 * Data for updating a catch (very limited per schema)
 */
export interface UpdateCatchData {
  title?: string;
  description?: string | null;
  visibility?: VisibilityType;
  hideExactSpot?: boolean;
  allowRatings?: boolean;
}

/**
 * Data for creating a session
 */
export interface CreateSessionData {
  title: string;
  venueId?: string | null;
  venueNameManual?: string | null;
  date?: string | null; // YYYY-MM-DD
  notes?: string | null;
}

/**
 * Data for updating a session
 */
export interface UpdateSessionData {
  title?: string;
  venueId?: string | null;
  venueNameManual?: string | null;
  date?: string | null; // YYYY-MM-DD
  notes?: string | null;
}

/**
 * Data for creating a comment
 */
export interface CreateCommentData {
  catchId: string;
  body: string;
  mentionedUsernames?: string[];
}

/**
 * Data for updating profile
 */
export interface UpdateProfileData {
  fullName?: string | null;
  avatarPath?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
}

/**
 * Data for creating a report
 */
export interface CreateReportData {
  targetType: 'catch' | 'comment' | 'profile';
  targetId: string;
  reason: string;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filters for catch queries
 */
export interface CatchFilters {
  userId?: string;
  speciesSlug?: string;
  locationLabel?: string;
  normalizedLocation?: string;
  waterTypeCode?: string;
  methodTag?: string;
  visibility?: VisibilityType | VisibilityType[];
  minWeight?: number;
  maxWeight?: number;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  tags?: string[]; // Matches any of these tags
  hasVideo?: boolean;
}

/**
 * Sort options for catches
 */
export type CatchSortBy =
  | 'created_at' // Newest first
  | 'caught_at' // Most recent catch date
  | 'weight' // Heaviest first
  | 'rating' // Highest rated first
  | 'reactions'; // Most reactions first

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * Query options for catches
 */
export interface CatchQueryOptions extends PaginationOptions {
  filters?: CatchFilters;
  sortBy?: CatchSortBy;
  includeDeleted?: boolean;
}

/**
 * Leaderboard filters
 */
export interface LeaderboardFilters {
  speciesSlug?: string;
  normalizedLocation?: string;
  waterTypeCode?: string;
  methodTag?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}

/**
 * Leaderboard sort options
 */
export type LeaderboardSortBy =
  | 'total_score' // Composite score
  | 'weight' // Heaviest fish
  | 'rating' // Highest rated
  | 'reactions'; // Most reactions

/**
 * Leaderboard query options
 */
export interface LeaderboardQueryOptions extends PaginationOptions {
  filters?: LeaderboardFilters;
  sortBy?: LeaderboardSortBy;
}

// ============================================================================
// RATE LIMIT TYPES
// ============================================================================

/**
 * Rate limit status response
 */
export interface RateLimitStatus {
  isAllowed: boolean;
  currentCount: number;
  maxCount: number;
  windowHours: number;
  resetAt: Date | null;
}

/**
 * User rate limits summary
 */
export interface UserRateLimits {
  action: string;
  countLastHour: number;
  oldestAction: Date;
  newestAction: Date;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert database row to domain Profile
 */
export function profileFromRow(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    username: row.username,
    fullName: row.full_name,
    avatarPath: row.avatar_path,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    location: row.location,
    website: row.website,
    warnCount: row.warn_count,
    moderationStatus: row.moderation_status,
    suspensionUntil: row.suspension_until ? new Date(row.suspension_until) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert database row to domain Species
 */
export function speciesFromRow(row: SpeciesRow): Species {
  return {
    id: row.id,
    slug: row.slug,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    category: row.category,
    recordWeight: row.record_weight,
    recordWeightUnit: row.record_weight_unit,
    imageUrl: row.image_url,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to domain Venue
 */
export function venueFromRow(row: VenueRow): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    region: row.region,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
    imageUrl: row.image_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert database row to domain Session
 */
export function sessionFromRow(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    venueId: row.venue_id,
    title: row.title,
    venueNameManual: row.venue_name_manual,
    date: row.date,
    notes: row.notes,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert database row to domain Catch
 */
export function catchFromRow(row: CatchRow): Catch {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    venueId: row.venue_id,
    speciesId: row.species_id,
    imageUrl: row.image_url,
    title: row.title,
    caughtAt: new Date(row.caught_at),
    description: row.description,
    speciesSlug: row.species_slug,
    customSpecies: row.custom_species,
    weight: row.weight,
    weightUnit: row.weight_unit,
    length: row.length,
    lengthUnit: row.length_unit,
    locationLabel: row.location_label,
    normalizedLocation: row.normalized_location,
    waterTypeCode: row.water_type_code,
    baitUsed: row.bait_used,
    methodTag: row.method_tag,
    equipmentUsed: row.equipment_used,
    timeOfDay: row.time_of_day,
    conditions: row.conditions as CatchConditions,
    tags: row.tags,
    galleryPhotos: row.gallery_photos,
    videoUrl: row.video_url,
    visibility: row.visibility,
    hideExactSpot: row.hide_exact_spot,
    allowRatings: row.allow_ratings,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert database row to domain Comment
 */
export function commentFromRow(row: CatchCommentRow): Comment {
  return {
    id: row.id,
    catchId: row.catch_id,
    userId: row.user_id,
    body: row.body,
    mentionedUsernames: row.mentioned_usernames,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to domain Reaction
 */
export function reactionFromRow(row: CatchReactionRow): Reaction {
  return {
    catchId: row.catch_id,
    userId: row.user_id,
    reaction: row.reaction,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to domain Rating
 */
export function ratingFromRow(row: RatingRow): Rating {
  return {
    catchId: row.catch_id,
    userId: row.user_id,
    rating: row.rating,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to domain Notification
 */
export function notificationFromRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    type: row.type,
    message: row.message,
    catchId: row.catch_id,
    commentId: row.comment_id,
    extraData: row.extra_data,
    isRead: row.is_read,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to domain Follow
 */
export function followFromRow(row: ProfileFollowRow): Follow {
  return {
    id: row.id,
    followerId: row.follower_id,
    followingId: row.following_id,
    createdAt: new Date(row.created_at),
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a catch is public
 */
export function isPublicCatch(catch_: Catch): boolean {
  return catch_.visibility === 'public' && catch_.deletedAt === null;
}

/**
 * Check if a catch is visible to a user
 */
export function isCatchVisibleTo(catch_: Catch, userId: string | null, isFollowing: boolean): boolean {
  // Deleted catches are never visible
  if (catch_.deletedAt !== null) return false;

  // Owner can always see their own catches
  if (catch_.userId === userId) return true;

  // Check visibility
  switch (catch_.visibility) {
    case 'public':
      return true;
    case 'followers':
      return isFollowing;
    case 'private':
      return false;
    default:
      return false;
  }
}

/**
 * Check if a profile is suspended
 */
export function isProfileSuspended(profile: Profile): boolean {
  if (profile.moderationStatus === 'suspended' && profile.suspensionUntil) {
    return new Date() < profile.suspensionUntil;
  }
  return profile.moderationStatus === 'suspended' || profile.moderationStatus === 'banned';
}

/**
 * Check if user can post content
 */
export function canUserPost(profile: Profile): boolean {
  return !isProfileSuspended(profile);
}
