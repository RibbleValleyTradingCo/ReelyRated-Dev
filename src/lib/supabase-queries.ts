/**
 * PHASE 1 SUPABASE QUERIES
 *
 * Example functions for interacting with the database.
 * These show you how to create sessions, catches, and fetch data.
 *
 * Usage:
 *   import { createSession, createCatch, getUserSessions } from '@/lib/supabase-queries'
 */

import { createClient } from '@supabase/supabase-js';
import type {
  UserProfile,
  UserProfileUpdate,
  Session,
  SessionInsert,
  SessionUpdate,
  Catch,
  CatchInsert,
  CatchWithProfile,
  SessionWithCatches,
  WaterType,
  Bait,
  Tag,
} from '@/types/phase1-database';

// Initialize Supabase client
// You should have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// PROFILES
// ============================================================================

/**
 * Get a user profile by ID
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/**
 * Get a user profile by username
 */
export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/**
 * Update the current user's profile
 */
export async function updateMyProfile(updates: UserProfileUpdate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

// ============================================================================
// SESSIONS
// ============================================================================

/**
 * Create a new fishing session
 */
export async function createSession(session: SessionInsert) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data as Session;
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null) // Only non-deleted sessions
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Session[];
}

/**
 * Get a single session by ID
 */
export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data as Session;
}

/**
 * Update a session
 */
export async function updateSession(sessionId: string, updates: SessionUpdate) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as Session;
}

/**
 * Soft delete a session
 */
export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}

/**
 * Get session with all its catches
 */
export async function getSessionWithCatches(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      catches (*)
    `)
    .eq('id', sessionId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data as SessionWithCatches;
}

// ============================================================================
// CATCHES
// ============================================================================

/**
 * Create a new catch
 */
export async function createCatch(catchData: CatchInsert) {
  const { data, error } = await supabase
    .from('catches')
    .insert(catchData)
    .select()
    .single();

  if (error) throw error;
  return data as Catch;
}

/**
 * Get a single catch by ID
 */
export async function getCatch(catchId: string) {
  const { data, error } = await supabase
    .from('catches')
    .select('*')
    .eq('id', catchId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data as Catch;
}

/**
 * Get a catch with the owner's profile
 */
export async function getCatchWithProfile(catchId: string) {
  const { data, error } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('id', catchId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data as CatchWithProfile;
}

/**
 * Get all catches for a user
 */
export async function getUserCatches(userId: string) {
  const { data, error } = await supabase
    .from('catches')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('caught_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Catch[];
}

/**
 * Get public feed of catches (all public catches, most recent first)
 */
export async function getPublicCatchesFeed(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data as CatchWithProfile[];
}

/**
 * Get catches for a specific session
 */
export async function getSessionCatches(sessionId: string) {
  const { data, error } = await supabase
    .from('catches')
    .select('*')
    .eq('session_id', sessionId)
    .is('deleted_at', null)
    .order('caught_at', { ascending: false });

  if (error) throw error;
  return data as Catch[];
}

/**
 * Soft delete a catch
 */
export async function deleteCatch(catchId: string, userId?: string) {
  const now = new Date().toISOString();
  const query = supabase
    .from('catches')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', catchId);

  if (userId) {
    query.eq('user_id', userId);
  }

  const { error } = await query;

  if (error) throw error;
}

/**
 * Update a catch's editable fields (owner-only via RLS).
 * Currently limited to description and tags to keep scope tight.
 */
export async function updateCatchFields(
  catchId: string,
  updates: { description?: string | null; tags?: string[] | null }
) {
  const { error } = await supabase
    .from('catches')
    .update(updates)
    .eq('id', catchId);

  if (error) throw error;
}

/**
 * Search catches by species
 */
export async function searchCatchesBySpecies(species: string, limit = 20) {
  const { data, error } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .ilike('species', `%${species}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CatchWithProfile[];
}

/**
 * Get heaviest catches (for leaderboards)
 */
export async function getHeaviestCatches(limit = 10) {
  const { data, error } = await supabase
    .from('catches')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .not('weight', 'is', null)
    .order('weight', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CatchWithProfile[];
}

// ============================================================================
// LOOKUP TABLES
// ============================================================================

/**
 * Get all water types
 */
export async function getWaterTypes() {
  const { data, error } = await supabase
    .from('water_types')
    .select('*')
    .order('label');

  if (error) throw error;
  return data as WaterType[];
}

/**
 * Get all baits
 */
export async function getBaits() {
  const { data, error } = await supabase
    .from('baits')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw error;
  return data as Bait[];
}

/**
 * Get all method tags
 */
export async function getMethods() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('category', 'method')
    .order('label');

  if (error) throw error;
  return data as Tag[];
}

/**
 * Get baits grouped by category
 */
export async function getBaitsByCategory() {
  const baits = await getBaits();

  // Group by category
  const grouped: Record<string, Bait[]> = {};
  for (const bait of baits) {
    if (!grouped[bait.category]) {
      grouped[bait.category] = [];
    }
    grouped[bait.category].push(bait);
  }

  return grouped;
}

// ============================================================================
// ANALYTICS / INSIGHTS (Simple examples for Phase 1)
// ============================================================================

/**
 * Get catch count by species for a user
 */
export async function getUserCatchCountBySpecies(userId: string) {
  const { data, error } = await supabase
    .from('catches')
    .select('species')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) throw error;

  // Count by species in JS
  const counts: Record<string, number> = {};
  for (const catchData of data) {
    const species = catchData.species || 'Unknown';
    counts[species] = (counts[species] || 0) + 1;
  }

  return counts;
}

/**
 * Get catch count by venue for a user
 */
export async function getUserCatchCountByVenue(userId: string) {
  const { data, error } = await supabase
    .from('catches')
    .select('location')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const catchData of data) {
    const venue = catchData.location || 'Unknown';
    counts[venue] = (counts[venue] || 0) + 1;
  }

  return counts;
}

/**
 * Get user's total catch count
 */
export async function getUserCatchCount(userId: string) {
  const { count, error } = await supabase
    .from('catches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) throw error;
  return count || 0;
}

/**
 * Get user's session count
 */
export async function getUserSessionCount(userId: string) {
  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) throw error;
  return count || 0;
}
