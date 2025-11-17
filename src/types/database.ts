/**
 * DATABASE TYPES - ReelyRated V2
 *
 * These types match the SQL schema exactly (20251116000000_v2_complete_rebuild.sql)
 * They represent the raw database row structure from Supabase.
 *
 * For cleaner app-level types, see domain.ts
 *
 * Usage:
 *   import type { Database, Tables, Enums } from '@/types/database'
 */

// ============================================================================
// ENUMS (matching PostgreSQL enums)
// ============================================================================

export type VisibilityType = 'public' | 'followers' | 'private';
export type WeightUnit = 'kg' | 'lb_oz';
export type LengthUnit = 'cm' | 'in';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type NotificationType =
  | 'new_follower'
  | 'new_comment'
  | 'new_rating'
  | 'new_reaction'
  | 'mention'
  | 'system'
  | 'admin_report'
  | 'admin_warning';

export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type ReportTargetType = 'catch' | 'comment' | 'profile';

export type WarningSeverity = 'warning' | 'temporary_suspension' | 'permanent_ban';
export type ModerationStatus = 'active' | 'warned' | 'suspended' | 'banned';

export type ModAction =
  | 'delete_catch'
  | 'delete_comment'
  | 'restore_catch'
  | 'restore_comment'
  | 'warn_user'
  | 'suspend_user';

export type ReactionType = 'like' | 'love' | 'fire';

// ============================================================================
// LOOKUP TABLES
// ============================================================================

export interface WaterTypeRow {
  code: string;
  label: string;
  group_name: string | null;
  created_at: string;
}

export interface BaitRow {
  slug: string;
  label: string;
  category: string;
  created_at: string;
}

export interface TagRow {
  slug: string;
  label: string;
  category: string;
  method_group: string | null;
  created_at: string;
}

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * User profile (1:1 with auth.users)
 */
export interface ProfileRow {
  // Identity
  user_id: string; // UUID - references auth.users(id)
  username: string; // CITEXT - unique, case-insensitive
  full_name: string | null;

  // Profile info
  avatar_path: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;

  // Moderation
  warn_count: number;
  moderation_status: ModerationStatus;
  suspension_until: string | null; // TIMESTAMPTZ

  // Timestamps
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Fish species catalog
 */
export interface SpeciesRow {
  // Identity
  id: string; // UUID
  slug: string; // CITEXT - unique

  // Names
  common_name: string;
  scientific_name: string | null;

  // Classification
  category: string | null;

  // Records
  record_weight: number | null; // NUMERIC(8,2)
  record_weight_unit: WeightUnit | null;

  // Media
  image_url: string | null;

  created_at: string; // TIMESTAMPTZ
}

/**
 * Fishing venue catalog
 */
export interface VenueRow {
  // Identity
  id: string; // UUID
  slug: string; // CITEXT - unique

  // Details
  name: string;
  region: string | null;
  country: string | null;

  // Location
  latitude: number | null; // DOUBLE PRECISION
  longitude: number | null; // DOUBLE PRECISION

  // Info
  description: string | null;
  image_url: string | null;

  // Timestamps
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Fishing session (trip container)
 */
export interface SessionRow {
  // Identity
  id: string; // UUID
  user_id: string; // UUID - references profiles(user_id)
  venue_id: string | null; // UUID - references venues(id)

  // Session details
  title: string;
  venue_name_manual: string | null;
  date: string | null; // DATE (YYYY-MM-DD)
  notes: string | null;

  // Soft delete
  deleted_at: string | null; // TIMESTAMPTZ

  // Timestamps
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Individual catch record
 */
export interface CatchRow {
  // Identity
  id: string; // UUID
  user_id: string; // UUID - references profiles(user_id)
  session_id: string | null; // UUID - references sessions(id)
  venue_id: string | null; // UUID - references venues(id)
  species_id: string | null; // UUID - references species(id)

  // Required fields
  image_url: string;
  title: string;
  caught_at: string; // TIMESTAMPTZ

  // Optional descriptive fields
  description: string | null;
  species_slug: string | null; // CITEXT - denormalized for fast filtering
  custom_species: string | null;

  // Fish measurements
  weight: number | null; // NUMERIC(8,2)
  weight_unit: WeightUnit | null;
  length: number | null; // NUMERIC(8,2)
  length_unit: LengthUnit | null;

  // Location details
  location_label: string | null;
  normalized_location: string | null; // CITEXT - auto-populated from location_label
  water_type_code: string | null;

  // Tactics/Method
  bait_used: string | null;
  method_tag: string | null;
  equipment_used: string | null;

  // Timing
  time_of_day: TimeOfDay | null;

  // Flexible data
  conditions: Record<string, unknown>; // JSONB
  tags: string[]; // TEXT[]
  gallery_photos: string[]; // TEXT[]
  video_url: string | null;

  // Privacy settings
  visibility: VisibilityType;
  hide_exact_spot: boolean;
  allow_ratings: boolean;

  // Soft delete & timestamps
  deleted_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ============================================================================
// SOCIAL TABLES
// ============================================================================

/**
 * Comment on a catch
 */
export interface CatchCommentRow {
  id: string; // UUID
  catch_id: string; // UUID - references catches(id)
  user_id: string; // UUID - references profiles(user_id)

  body: string;
  mentioned_usernames: string[]; // TEXT[]

  deleted_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

/**
 * Reaction on a catch
 */
export interface CatchReactionRow {
  catch_id: string; // UUID - references catches(id)
  user_id: string; // UUID - references profiles(user_id)
  reaction: ReactionType;
  created_at: string; // TIMESTAMPTZ
}

/**
 * Rating on a catch (1-10)
 */
export interface RatingRow {
  catch_id: string; // UUID - references catches(id)
  user_id: string; // UUID - references profiles(user_id)
  rating: number; // SMALLINT (1-10)
  created_at: string; // TIMESTAMPTZ
}

/**
 * User following relationship
 */
export interface ProfileFollowRow {
  id: string; // UUID
  follower_id: string; // UUID - references profiles(user_id)
  following_id: string; // UUID - references profiles(user_id)
  created_at: string; // TIMESTAMPTZ
}

// ============================================================================
// NOTIFICATION & MODERATION TABLES
// ============================================================================

/**
 * User notification
 */
export interface NotificationRow {
  id: string; // UUID
  user_id: string; // UUID - references profiles(user_id)
  actor_id: string | null; // UUID - references profiles(user_id)
  type: NotificationType;
  message: string;

  // Optional references
  catch_id: string | null; // UUID - references catches(id)
  comment_id: string | null; // UUID - references catch_comments(id)

  // Extra data
  extra_data: Record<string, unknown>; // JSONB

  // Read status
  is_read: boolean;
  read_at: string | null; // TIMESTAMPTZ

  created_at: string; // TIMESTAMPTZ
}

/**
 * Content report
 */
export interface ReportRow {
  id: string; // UUID
  reporter_id: string; // UUID - references profiles(user_id)
  target_type: ReportTargetType;
  target_id: string; // UUID
  reason: string;

  // Status tracking
  status: ReportStatus;
  resolved_at: string | null; // TIMESTAMPTZ
  resolved_by: string | null; // UUID - references profiles(user_id)
  notes: string | null;

  created_at: string; // TIMESTAMPTZ
}

/**
 * Admin user registry
 */
export interface AdminUserRow {
  id: string; // UUID
  user_id: string; // UUID - unique, references auth.users(id)
  created_at: string; // TIMESTAMPTZ
}

/**
 * User warning record
 */
export interface UserWarningRow {
  id: string; // UUID
  user_id: string; // UUID - references profiles(user_id)
  issued_by: string | null; // UUID - references profiles(user_id)
  severity: WarningSeverity;
  reason: string;

  // Duration (for temporary suspensions)
  duration_hours: number | null; // INTEGER
  expires_at: string | null; // TIMESTAMPTZ

  created_at: string; // TIMESTAMPTZ
}

/**
 * Moderation audit log
 */
export interface ModerationLogRow {
  id: string; // UUID
  admin_id: string | null; // UUID - references profiles(user_id)
  action: ModAction;
  target_type: ReportTargetType;
  target_id: string; // UUID
  reason: string | null;
  details: Record<string, unknown>; // JSONB
  created_at: string; // TIMESTAMPTZ
}

// ============================================================================
// SYSTEM TABLES
// ============================================================================

/**
 * Rate limit tracking
 */
export interface RateLimitRow {
  id: string; // UUID
  user_id: string; // UUID - references auth.users(id)
  action: string;
  created_at: string; // TIMESTAMPTZ
}

// ============================================================================
// HELPER TYPES FOR OPERATIONS
// ============================================================================

/**
 * Insert types (for creating new records)
 * Omits auto-generated fields like id, created_at, updated_at
 */
export type ProfileInsert = Omit<ProfileRow, 'created_at' | 'updated_at' | 'warn_count' | 'moderation_status'> & {
  warn_count?: number;
  moderation_status?: ModerationStatus;
};

export type SpeciesInsert = Omit<SpeciesRow, 'id' | 'created_at'> & {
  id?: string;
};

export type VenueInsert = Omit<VenueRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type SessionInsert = Omit<SessionRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  id?: string;
};

export type CatchInsert = Omit<CatchRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'normalized_location'> & {
  id?: string;
};

export type CatchCommentInsert = Omit<CatchCommentRow, 'id' | 'created_at' | 'deleted_at'> & {
  id?: string;
};

export type CatchReactionInsert = Omit<CatchReactionRow, 'created_at'>;

export type RatingInsert = Omit<RatingRow, 'created_at'>;

export type ProfileFollowInsert = Omit<ProfileFollowRow, 'id' | 'created_at'> & {
  id?: string;
};

export type NotificationInsert = Omit<NotificationRow, 'id' | 'created_at' | 'is_read' | 'read_at'> & {
  id?: string;
  is_read?: boolean;
};

export type ReportInsert = Omit<ReportRow, 'id' | 'created_at' | 'status' | 'resolved_at' | 'resolved_by' | 'notes'> & {
  id?: string;
  status?: ReportStatus;
};

/**
 * Update types (for updating existing records)
 * All fields optional, omits immutable fields
 */
export type ProfileUpdate = Partial<Pick<
  ProfileRow,
  'full_name' | 'avatar_path' | 'avatar_url' | 'bio' | 'location' | 'website' |
  'warn_count' | 'moderation_status' | 'suspension_until'
>>;

export type SpeciesUpdate = Partial<Omit<SpeciesRow, 'id' | 'created_at'>>;

export type VenueUpdate = Partial<Omit<VenueRow, 'id' | 'created_at' | 'updated_at'>>;

export type SessionUpdate = Partial<Pick<
  SessionRow,
  'title' | 'venue_id' | 'venue_name_manual' | 'date' | 'notes' | 'deleted_at'
>>;

export type CatchUpdate = Partial<Pick<
  CatchRow,
  'title' | 'description' | 'visibility' | 'hide_exact_spot' | 'allow_ratings' | 'deleted_at'
>>;

export type CatchCommentUpdate = Partial<Pick<CatchCommentRow, 'body' | 'deleted_at'>>;

export type CatchReactionUpdate = Partial<Pick<CatchReactionRow, 'reaction'>>;

export type NotificationUpdate = Partial<Pick<NotificationRow, 'is_read' | 'read_at'>>;

export type ReportUpdate = Partial<Pick<
  ReportRow,
  'status' | 'resolved_at' | 'resolved_by' | 'notes'
>>;

// ============================================================================
// DATABASE TYPE COLLECTION
// ============================================================================

/**
 * Main Database type structure (similar to Supabase generated types)
 */
export interface Database {
  public: {
    Tables: {
      water_types: {
        Row: WaterTypeRow;
        Insert: Omit<WaterTypeRow, 'created_at'>;
        Update: Partial<Omit<WaterTypeRow, 'code' | 'created_at'>>;
      };
      baits: {
        Row: BaitRow;
        Insert: Omit<BaitRow, 'created_at'>;
        Update: Partial<Omit<BaitRow, 'slug' | 'created_at'>>;
      };
      tags: {
        Row: TagRow;
        Insert: Omit<TagRow, 'created_at'>;
        Update: Partial<Omit<TagRow, 'slug' | 'created_at'>>;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      species: {
        Row: SpeciesRow;
        Insert: SpeciesInsert;
        Update: SpeciesUpdate;
      };
      venues: {
        Row: VenueRow;
        Insert: VenueInsert;
        Update: VenueUpdate;
      };
      sessions: {
        Row: SessionRow;
        Insert: SessionInsert;
        Update: SessionUpdate;
      };
      catches: {
        Row: CatchRow;
        Insert: CatchInsert;
        Update: CatchUpdate;
      };
      catch_comments: {
        Row: CatchCommentRow;
        Insert: CatchCommentInsert;
        Update: CatchCommentUpdate;
      };
      catch_reactions: {
        Row: CatchReactionRow;
        Insert: CatchReactionInsert;
        Update: CatchReactionUpdate;
      };
      ratings: {
        Row: RatingRow;
        Insert: RatingInsert;
        Update: never; // Ratings cannot be updated, only replaced
      };
      profile_follows: {
        Row: ProfileFollowRow;
        Insert: ProfileFollowInsert;
        Update: never; // Follows cannot be updated
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      reports: {
        Row: ReportRow;
        Insert: ReportInsert;
        Update: ReportUpdate;
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Omit<AdminUserRow, 'id' | 'created_at'>;
        Update: never; // Admin users cannot be updated
      };
      user_warnings: {
        Row: UserWarningRow;
        Insert: Omit<UserWarningRow, 'id' | 'created_at'>;
        Update: never; // Warnings are immutable
      };
      moderation_log: {
        Row: ModerationLogRow;
        Insert: Omit<ModerationLogRow, 'id' | 'created_at'>;
        Update: never; // Audit logs are immutable
      };
      rate_limits: {
        Row: RateLimitRow;
        Insert: Omit<RateLimitRow, 'id' | 'created_at'>;
        Update: never; // Rate limits are immutable
      };
    };
    Enums: {
      visibility_type: VisibilityType;
      weight_unit: WeightUnit;
      length_unit: LengthUnit;
      time_of_day: TimeOfDay;
      notification_type: NotificationType;
      report_status: ReportStatus;
      report_target_type: ReportTargetType;
      warning_severity: WarningSeverity;
      moderation_status: ModerationStatus;
      mod_action: ModAction;
      reaction_type: ReactionType;
    };
  };
}

/**
 * Convenience type to access table rows
 * Usage: Tables<'catches'> returns CatchRow
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Convenience type to access enum values
 * Usage: Enums<'visibility_type'> returns VisibilityType
 */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
