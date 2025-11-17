/**
 * PHASE 1 DATABASE TYPES
 *
 * Clean TypeScript interfaces for ReelyRated core entities.
 * These match the Phase 1 database schema.
 *
 * Usage:
 *   import type { UserProfile, Session, Catch } from '@/types/phase1-database'
 */

// ============================================================================
// ENUMS
// ============================================================================

export type WeightUnit = 'lb_oz' | 'kg' | 'g';
export type LengthUnit = 'cm' | 'in';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type VisibilityType = 'public' | 'followers' | 'private';

// ============================================================================
// LOOKUP TYPES
// ============================================================================

export interface WaterType {
  code: string;
  label: string;
  group_name: string;
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
// USER PROFILE
// ============================================================================

export interface UserProfile {
  // Identity
  id: string; // UUID from auth.users
  username: string; // Unique, immutable, URL-safe (e.g., "john_doe")
  display_name: string | null; // User-friendly name (e.g., "John Doe")

  // Profile info
  bio: string | null;
  avatar_url: string | null;
  avatar_path: string | null; // Storage path for avatar file
  location: string | null; // e.g., "Oxfordshire, UK"
  website: string | null;

  // Timestamps
  created_at: string; // ISO 8601 timestamp
  updated_at: string;
}

// For creating a new profile (used in INSERT operations)
export interface UserProfileInsert {
  id: string; // Must match auth.users.id
  username: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  location?: string | null;
  website?: string | null;
}

// For updating a profile (all fields optional)
export interface UserProfileUpdate {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  location?: string | null;
  website?: string | null;
  // Note: username is NOT here because it's immutable
}

// ============================================================================
// SESSION (Fishing Trip)
// ============================================================================

export interface Session {
  // Identity
  id: string; // UUID
  user_id: string; // Owner

  // Session details
  title: string;
  venue: string | null; // Free text for now (Phase 3: becomes venue_id)
  date: string | null; // ISO date string (YYYY-MM-DD)
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Soft delete
}

export interface SessionInsert {
  user_id: string;
  title: string;
  venue?: string | null;
  date?: string | null;
  notes?: string | null;
}

export interface SessionUpdate {
  title?: string;
  venue?: string | null;
  date?: string | null;
  notes?: string | null;
}

// ============================================================================
// CATCH
// ============================================================================

/**
 * Conditions stored as JSONB.
 * This is flexible - you can add any fields you want here.
 */
export interface CatchConditions {
  // Weather
  weather?: 'sunny' | 'overcast' | 'raining' | 'windy' | string;
  temperature?: number; // Celsius
  temperature_unit?: 'C' | 'F';

  // Water
  water_clarity?: 'clear' | 'coloured' | 'murky';
  water_temp?: number;

  // Wind
  wind_speed?: number;
  wind_direction?: string;

  // GPS coordinates (if user allows)
  latitude?: number;
  longitude?: number;

  // Any other custom fields...
  [key: string]: unknown;
}

export interface Catch {
  // Identity
  id: string; // UUID
  user_id: string; // Owner
  session_id: string | null; // Optional link to a session

  // Required fields
  image_url: string; // Main photo
  title: string;
  species: string; // e.g., "Common Carp" (Phase 3: becomes species_id)
  caught_at: string; // ISO date (YYYY-MM-DD)

  // Optional description
  description: string | null;

  // Fish measurements
  weight: number | null;
  weight_unit: WeightUnit | null;
  length: number | null;
  length_unit: LengthUnit | null;

  // Location
  location: string | null; // Fishery name
  peg_or_swim: string | null; // Specific spot (e.g., "Peg 12")
  water_type: string | null; // Should match water_types.code

  // Tactics
  bait_used: string | null; // Should match baits.slug
  method: string | null; // Should match tags.slug (where category='method')
  equipment_used: string | null; // Free text

  // Timing
  time_of_day: TimeOfDay | null;

  // Flexible data
  conditions: CatchConditions; // JSONB
  tags: string[]; // Free-form tags
  gallery_photos: string[]; // URLs to additional photos (max 6)
  video_url: string | null;

  // Privacy
  visibility: VisibilityType;
  hide_exact_spot: boolean;
  allow_ratings: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Soft delete
}

export interface CatchInsert {
  user_id: string;
  session_id?: string | null;

  // Required
  image_url: string;
  title: string;
  species: string;
  caught_at: string; // YYYY-MM-DD

  // Optional
  description?: string | null;
  weight?: number | null;
  weight_unit?: WeightUnit | null;
  length?: number | null;
  length_unit?: LengthUnit | null;
  location?: string | null;
  peg_or_swim?: string | null;
  water_type?: string | null;
  bait_used?: string | null;
  method?: string | null;
  equipment_used?: string | null;
  time_of_day?: TimeOfDay | null;
  conditions?: CatchConditions;
  tags?: string[];
  gallery_photos?: string[];
  video_url?: string | null;
  visibility?: VisibilityType;
  hide_exact_spot?: boolean;
  allow_ratings?: boolean;
}

// Note: Catches are immutable after creation (per requirements),
// so CatchUpdate is only for soft delete
export interface CatchUpdate {
  deleted_at?: string | null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extended Catch with related data (for displaying in UI)
 */
export interface CatchWithProfile extends Catch {
  profile: UserProfile;
}

/**
 * Session with catch count
 */
export interface SessionWithCatchCount extends Session {
  catch_count: number;
}

/**
 * Extended Session with catches
 */
export interface SessionWithCatches extends Session {
  catches: Catch[];
}
