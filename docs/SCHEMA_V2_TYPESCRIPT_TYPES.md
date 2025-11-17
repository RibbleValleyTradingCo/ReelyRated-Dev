# TypeScript Domain Types for Schema V2

## Core Entity Types

```typescript
// src/types/domain.ts

import { Database } from '@/integrations/supabase/types';

// ============================================================================
// ENUMS (matching DB enums)
// ============================================================================

export type VisibilityType = 'public' | 'followers' | 'private';
export type WeightUnit = 'kg' | 'lb_oz';
export type LengthUnit = 'cm' | 'in';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type NotificationType =
    | 'new_follower' | 'new_comment' | 'new_rating' | 'new_reaction'
    | 'mention' | 'system' | 'admin_report' | 'admin_warning';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type ReportTargetType = 'catch' | 'comment' | 'profile';
export type WarningSeverity = 'warning' | 'temporary_suspension' | 'permanent_ban';
export type ModerationStatus = 'active' | 'warned' | 'suspended' | 'banned';
export type ModAction =
    | 'delete_catch' | 'delete_comment' | 'restore_catch'
    | 'restore_comment' | 'warn_user' | 'suspend_user';
export type ReactionType = 'like' | 'love' | 'fire';

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface UserProfile {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_path: string | null;
    avatar_url: string | null; // Legacy
    bio: string | null;
    location: string | null;
    website: string | null;
    warn_count: number;
    moderation_status: ModerationStatus;
    suspension_until: string | null; // ISO timestamp
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

export interface ProfileInsert {
    user_id: string;
    username: string;
    full_name?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
}

export interface ProfileUpdate {
    full_name?: string | null;
    bio?: string | null;
    avatar_path?: string | null;
    location?: string | null;
    website?: string | null;
}

// ============================================================================
// SPECIES TYPES
// ============================================================================

export interface Species {
    id: string;
    slug: string;
    common_name: string;
    scientific_name: string | null;
    category: string | null;
    record_weight: number | null;
    record_weight_unit: WeightUnit | null;
    image_url: string | null;
    created_at: string;
}

// ============================================================================
// VENUE TYPES
// ============================================================================

export interface Venue {
    id: string;
    slug: string;
    name: string;
    region: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface VenueInsert {
    slug: string;
    name: string;
    region?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
    image_url?: string | null;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface Session {
    id: string;
    user_id: string;
    venue_id: string | null;
    title: string;
    venue_name_manual: string | null;
    date: string | null; // Date string YYYY-MM-DD
    notes: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SessionInsert {
    user_id: string;
    title: string;
    venue_id?: string | null;
    venue_name_manual?: string | null;
    date?: string | null;
    notes?: string | null;
}

export interface SessionUpdate {
    title?: string;
    venue_id?: string | null;
    venue_name_manual?: string | null;
    date?: string | null;
    notes?: string | null;
}

export interface SessionWithVenue extends Session {
    venue: Venue | null;
}

// ============================================================================
// CATCH TYPES
// ============================================================================

export interface Catch {
    id: string;
    user_id: string;
    session_id: string | null;
    venue_id: string | null;
    species_id: string | null;
    species_slug: string | null;
    custom_species: string | null;

    // Required
    image_url: string;
    title: string;
    caught_at: string; // ISO timestamp

    // Optional
    description: string | null;
    weight: number | null;
    weight_unit: WeightUnit | null;
    length: number | null;
    length_unit: LengthUnit | null;

    // Location
    location_label: string | null;
    normalized_location: string | null;
    water_type_code: string | null;

    // Tactics
    bait_used: string | null;
    method_tag: string | null;
    equipment_used: string | null;
    time_of_day: TimeOfDay | null;

    // Flexible data
    conditions: Record<string, any>; // JSONB
    tags: string[];
    gallery_photos: string[];
    video_url: string | null;

    // Privacy
    visibility: VisibilityType;
    hide_exact_spot: boolean;
    allow_ratings: boolean;

    // Timestamps
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CatchInsert {
    user_id: string;
    title: string;
    image_url: string;
    session_id?: string | null;
    venue_id?: string | null;
    species_id?: string | null;
    species_slug?: string | null;
    custom_species?: string | null;
    description?: string | null;
    weight?: number | null;
    weight_unit?: WeightUnit;
    length?: number | null;
    length_unit?: LengthUnit;
    location_label?: string | null;
    water_type_code?: string | null;
    bait_used?: string | null;
    method_tag?: string | null;
    equipment_used?: string | null;
    time_of_day?: TimeOfDay | null;
    caught_at?: string;
    conditions?: Record<string, any>;
    tags?: string[];
    gallery_photos?: string[];
    video_url?: string | null;
    visibility?: VisibilityType;
    hide_exact_spot?: boolean;
    allow_ratings?: boolean;
}

export interface CatchWithRelations extends Catch {
    profiles: Pick<UserProfile, 'username' | 'avatar_path' | 'avatar_url'>;
    species: Species | null;
    venue: Venue | null;
    session: Session | null;
    ratings: { rating: number }[];
    comments: { id: string }[];
    reactions: { user_id: string; reaction: ReactionType }[];
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

export interface CatchComment {
    id: string;
    catch_id: string;
    user_id: string;
    body: string;
    mentioned_usernames: string[];
    deleted_at: string | null;
    created_at: string;
}

export interface CatchCommentInsert {
    catch_id: string;
    user_id: string;
    body: string;
    mentioned_usernames?: string[];
}

export interface CatchCommentWithProfile extends CatchComment {
    profiles: Pick<UserProfile, 'username' | 'avatar_path' | 'avatar_url'>;
}

// ============================================================================
// REACTION TYPES
// ============================================================================

export interface CatchReaction {
    catch_id: string;
    user_id: string;
    reaction: ReactionType;
    created_at: string;
}

export interface CatchReactionInsert {
    catch_id: string;
    user_id: string;
    reaction?: ReactionType;
}

// ============================================================================
// RATING TYPES
// ============================================================================

export interface Rating {
    catch_id: string;
    user_id: string;
    rating: number; // 1-10
    created_at: string;
}

export interface RatingInsert {
    catch_id: string;
    user_id: string;
    rating: number;
}

// ============================================================================
// FOLLOW TYPES
// ============================================================================

export interface ProfileFollow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
}

export interface ProfileFollowInsert {
    follower_id: string;
    following_id: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: NotificationType;
    message: string;
    catch_id: string | null;
    comment_id: string | null;
    extra_data: Record<string, any>;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface NotificationWithActor extends Notification {
    actor: Pick<UserProfile, 'username' | 'avatar_path' | 'avatar_url'> | null;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface Report {
    id: string;
    reporter_id: string;
    target_type: ReportTargetType;
    target_id: string;
    reason: string;
    status: ReportStatus;
    resolved_at: string | null;
    resolved_by: string | null;
    notes: string | null;
    created_at: string;
}

export interface ReportInsert {
    reporter_id: string;
    target_type: ReportTargetType;
    target_id: string;
    reason: string;
}

export interface ReportWithProfiles extends Report {
    reporter: Pick<UserProfile, 'username'>;
    resolver: Pick<UserProfile, 'username'> | null;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminUser {
    id: string;
    user_id: string;
    created_at: string;
}

export interface UserWarning {
    id: string;
    user_id: string;
    issued_by: string | null;
    severity: WarningSeverity;
    reason: string;
    duration_hours: number | null;
    expires_at: string | null;
    created_at: string;
}

export interface ModerationLog {
    id: string;
    admin_id: string | null;
    action: ModAction;
    target_type: ReportTargetType;
    target_id: string;
    reason: string | null;
    details: Record<string, any>;
    created_at: string;
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

export interface LeaderboardEntry {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    species_slug: string | null;
    custom_species: string | null;
    weight: number | null;
    weight_unit: WeightUnit | null;
    length: number | null;
    length_unit: LengthUnit | null;
    image_url: string;
    gallery_photos: string[];
    video_url: string | null;
    location_label: string | null;
    normalized_location: string | null;
    water_type_code: string | null;
    method_tag: string | null;
    tags: string[];
    time_of_day: TimeOfDay | null;
    caught_at: string;
    conditions: Record<string, any>;
    created_at: string;
    visibility: VisibilityType;
    owner_username: string;
    owner_avatar_path: string | null;
    owner_avatar_url: string | null;
    avg_rating: number;
    rating_count: number;
    reaction_count: number;
    total_score: number;
}

// ============================================================================
// LOOKUP TYPES
// ============================================================================

export interface WaterType {
    code: string;
    label: string;
    group_name: string | null;
    created_at: string;
}

export interface Bait {
    slug: string;
    label: string;
    category: string;
    created_at: string;
}

export interface Tag {
    slug: string;
    label: string;
    category: string;
    method_group: string | null;
    created_at: string;
}

// ============================================================================
// RPC FUNCTION PARAMETER TYPES
// ============================================================================

export interface CreateNotificationParams {
    p_user_id: string;
    p_type: NotificationType;
    p_message: string;
    p_actor_id?: string | null;
    p_catch_id?: string | null;
    p_comment_id?: string | null;
    p_extra_data?: Record<string, any>;
}

export interface CheckRateLimitParams {
    p_user_id: string;
    p_action: string;
    p_max_attempts: number;
    p_window_minutes: number;
}

export interface RateLimitStatus {
    allowed: number;
    used: number;
    remaining: number;
    reset_at: string;
}

export interface AdminWarnUserParams {
    p_user_id: string;
    p_reason: string;
    p_severity?: WarningSeverity;
    p_duration_hours?: number | null;
}
```

## Example Usage

```typescript
// Querying catches with full relations
const { data, error } = await supabase
    .from('catches')
    .select(`
        *,
        profiles:user_id (username, avatar_path, avatar_url),
        species:species_id (slug, common_name),
        venue:venue_id (name, region),
        ratings (rating),
        comments:catch_comments (id),
        reactions:catch_reactions (user_id, reaction)
    `)
    .is('deleted_at', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

const catches: CatchWithRelations[] = data || [];

// Using RPC functions
const { data: isAllowed } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_action: 'catch_creation',
    p_max_attempts: 10,
    p_window_minutes: 60
});

// Admin operations
await supabase.rpc('admin_delete_catch', {
    p_catch_id: catchId,
    p_reason: 'Inappropriate content'
});
```
