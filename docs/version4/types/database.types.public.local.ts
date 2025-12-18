export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      baits: {
        Row: {
          category: string
          created_at: string
          label: string
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          label: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      catch_comments: {
        Row: {
          body: string
          catch_id: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          catch_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          catch_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catch_comments_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_scores_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "catch_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "catch_comments_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catch_reactions: {
        Row: {
          catch_id: string
          created_at: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          catch_id: string
          created_at?: string
          id?: string
          reaction?: string
          user_id: string
        }
        Update: {
          catch_id?: string
          created_at?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catch_reactions_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_reactions_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_scores_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catches: {
        Row: {
          allow_ratings: boolean
          bait_used: string | null
          caught_at: string | null
          conditions: Json | null
          created_at: string
          custom_species: string | null
          deleted_at: string | null
          description: string | null
          equipment_used: string | null
          gallery_photos: string[] | null
          hide_exact_spot: boolean
          id: string
          image_url: string
          length: number | null
          length_unit: Database["public"]["Enums"]["length_unit"] | null
          location: string | null
          location_label: string | null
          method: string | null
          method_tag: string | null
          peg_or_swim: string | null
          session_id: string | null
          species: string | null
          species_slug: string | null
          tags: string[] | null
          time_of_day: string | null
          title: string
          updated_at: string
          user_id: string
          venue_id: string | null
          video_url: string | null
          visibility: Database["public"]["Enums"]["visibility_type"]
          water_type: string | null
          water_type_code: string | null
          weight: number | null
          weight_unit: Database["public"]["Enums"]["weight_unit"] | null
        }
        Insert: {
          allow_ratings?: boolean
          bait_used?: string | null
          caught_at?: string | null
          conditions?: Json | null
          created_at?: string
          custom_species?: string | null
          deleted_at?: string | null
          description?: string | null
          equipment_used?: string | null
          gallery_photos?: string[] | null
          hide_exact_spot?: boolean
          id?: string
          image_url: string
          length?: number | null
          length_unit?: Database["public"]["Enums"]["length_unit"] | null
          location?: string | null
          location_label?: string | null
          method?: string | null
          method_tag?: string | null
          peg_or_swim?: string | null
          session_id?: string | null
          species?: string | null
          species_slug?: string | null
          tags?: string[] | null
          time_of_day?: string | null
          title: string
          updated_at?: string
          user_id: string
          venue_id?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
          water_type?: string | null
          water_type_code?: string | null
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["weight_unit"] | null
        }
        Update: {
          allow_ratings?: boolean
          bait_used?: string | null
          caught_at?: string | null
          conditions?: Json | null
          created_at?: string
          custom_species?: string | null
          deleted_at?: string | null
          description?: string | null
          equipment_used?: string | null
          gallery_photos?: string[] | null
          hide_exact_spot?: boolean
          id?: string
          image_url?: string
          length?: number | null
          length_unit?: Database["public"]["Enums"]["length_unit"] | null
          location?: string | null
          location_label?: string | null
          method?: string | null
          method_tag?: string | null
          peg_or_swim?: string | null
          session_id?: string | null
          species?: string | null
          species_slug?: string | null
          tags?: string[] | null
          time_of_day?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          venue_id?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
          water_type?: string | null
          water_type_code?: string | null
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["weight_unit"] | null
        }
        Relationships: [
          {
            foreignKeyName: "catches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_log: {
        Row: {
          action: string
          admin_id: string | null
          catch_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          catch_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          catch_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          catch_id: string | null
          comment_id: string | null
          created_at: string
          deleted_at: string | null
          extra_data: Json | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          catch_id?: string | null
          comment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          extra_data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          catch_id?: string | null
          comment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          extra_data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_scores_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "catch_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "catch_comments_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          is_deleted: boolean
          is_private: boolean
          location: string | null
          locked_for_deletion: boolean
          moderation_status: string
          status: string | null
          suspension_until: string | null
          updated_at: string
          username: string
          warn_count: number
          website: string | null
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          is_deleted?: boolean
          is_private?: boolean
          location?: string | null
          locked_for_deletion?: boolean
          moderation_status?: string
          status?: string | null
          suspension_until?: string | null
          updated_at?: string
          username: string
          warn_count?: number
          website?: string | null
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          is_deleted?: boolean
          is_private?: boolean
          location?: string | null
          locked_for_deletion?: boolean
          moderation_status?: string
          status?: string | null
          suspension_until?: string | null
          updated_at?: string
          username?: string
          warn_count?: number
          website?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          catch_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          catch_id: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          catch_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_scores_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
          venue: string | null
          venue_name_manual: string | null
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
          venue?: string | null
          venue_name_manual?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          venue?: string | null
          venue_name_manual?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string
          created_at: string
          label: string
          method_group: string | null
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          label: string
          method_group?: string | null
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          label?: string
          method_group?: string | null
          slug?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          admin_id: string | null
          created_at: string
          details: string | null
          duration_hours: number | null
          id: string
          issued_by: string | null
          reason: string
          severity: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          details?: string | null
          duration_hours?: number | null
          id?: string
          issued_by?: string | null
          reason: string
          severity: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          details?: string | null
          duration_hours?: number | null
          id?: string
          issued_by?: string | null
          reason?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_events: {
        Row: {
          booking_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string | null
          title: string
          updated_at: string
          venue_id: string
          website_url: string | null
        }
        Insert: {
          booking_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_published?: boolean
          starts_at: string
          ticket_info?: string | null
          title: string
          updated_at?: string
          venue_id: string
          website_url?: string | null
        }
        Update: {
          booking_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_published?: boolean
          starts_at?: string
          ticket_info?: string | null
          title?: string
          updated_at?: string
          venue_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_owners: {
        Row: {
          created_at: string
          role: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_owners_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_photos: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          image_path: string
          venue_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_path: string
          venue_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_ratings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          best_for_tags: string[] | null
          booking_url: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facilities: string[] | null
          id: string
          is_published: boolean
          location: string | null
          name: string
          notes_for_rr_team: string | null
          price_from: string | null
          short_tagline: string | null
          slug: string
          ticket_type: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          best_for_tags?: string[] | null
          booking_url?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facilities?: string[] | null
          id?: string
          is_published?: boolean
          location?: string | null
          name: string
          notes_for_rr_team?: string | null
          price_from?: string | null
          short_tagline?: string | null
          slug: string
          ticket_type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          best_for_tags?: string[] | null
          booking_url?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facilities?: string[] | null
          id?: string
          is_published?: boolean
          location?: string | null
          name?: string
          notes_for_rr_team?: string | null
          price_from?: string | null
          short_tagline?: string | null
          slug?: string
          ticket_type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      water_types: {
        Row: {
          code: string
          created_at: string
          group_name: string
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          group_name: string
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          group_name?: string
          label?: string
        }
        Relationships: []
      }
    }
    Views: {
      catch_comments_with_admin: {
        Row: {
          body: string | null
          catch_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          is_admin_author: boolean | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catch_comments_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_scores_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "catch_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "catch_comments_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catch_mention_candidates: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          catch_id: string | null
          last_interacted_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      leaderboard_scores_detailed: {
        Row: {
          avg_rating: number | null
          caught_at: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          gallery_photos: string[] | null
          id: string | null
          image_url: string | null
          is_blocked_from_viewer: boolean | null
          length: number | null
          length_unit: Database["public"]["Enums"]["length_unit"] | null
          location: string | null
          location_label: string | null
          method: string | null
          method_tag: string | null
          owner_username: string | null
          rating_count: number | null
          species: string | null
          species_slug: string | null
          tags: string[] | null
          title: string | null
          total_score: number | null
          user_id: string | null
          video_url: string | null
          water_type_code: string | null
          weight: number | null
          weight_unit: Database["public"]["Enums"]["weight_unit"] | null
        }
        Relationships: [
          {
            foreignKeyName: "catches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_stats: {
        Row: {
          avg_rating: number | null
          headline_pb_species: string | null
          headline_pb_unit: Database["public"]["Enums"]["weight_unit"] | null
          headline_pb_weight: number | null
          rating_count: number | null
          recent_catches_30d: number | null
          top_species: string[] | null
          total_catches: number | null
          venue_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_add_venue_owner: {
        Args: { p_role?: string; p_user_id: string; p_venue_id: string }
        Returns: undefined
      }
      admin_clear_moderation_status: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      admin_create_venue_event: {
        Args: {
          p_booking_url: string
          p_description: string
          p_ends_at: string
          p_event_type: string
          p_is_published: boolean
          p_starts_at: string
          p_ticket_info: string
          p_title: string
          p_venue_id: string
          p_website_url: string
        }
        Returns: string
      }
      admin_delete_account: {
        Args: { p_reason?: string; p_target: string }
        Returns: Json
      }
      admin_delete_catch: {
        Args: { p_catch_id: string; p_reason: string }
        Returns: undefined
      }
      admin_delete_comment: {
        Args: { p_comment_id: string; p_reason: string }
        Returns: undefined
      }
      admin_delete_venue_event: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      admin_get_venue_events: {
        Args: { p_venue_id: string }
        Returns: {
          booking_url: string
          created_at: string
          description: string
          ends_at: string
          event_type: string
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string
          title: string
          updated_at: string
          venue_id: string
          website_url: string
        }[]
      }
      admin_list_moderation_log: {
        Args: {
          p_action?: string
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_direction?: string
          p_to?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          admin_id: string
          admin_username: string
          catch_id: string
          comment_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_type: string
          user_id: string
        }[]
      }
      admin_list_reports: {
        Args: {
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_reported_user_id?: string
          p_sort_direction?: string
          p_status?: string
          p_to?: string
          p_type?: string
        }
        Returns: {
          created_at: string
          details: string
          id: string
          reason: string
          reported_user_id: string
          reported_username: string
          reporter_avatar_path: string
          reporter_avatar_url: string
          reporter_id: string
          reporter_username: string
          status: string
          target_id: string
          target_type: string
        }[]
      }
      admin_remove_venue_owner: {
        Args: { p_user_id: string; p_venue_id: string }
        Returns: undefined
      }
      admin_restore_catch: {
        Args: { p_catch_id: string; p_reason: string }
        Returns: undefined
      }
      admin_restore_comment: {
        Args: { p_comment_id: string; p_reason: string }
        Returns: undefined
      }
      admin_update_report_status: {
        Args: {
          p_report_id: string
          p_resolution_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      admin_update_venue_event: {
        Args: {
          p_booking_url: string
          p_description: string
          p_ends_at: string
          p_event_id: string
          p_event_type: string
          p_is_published: boolean
          p_starts_at: string
          p_ticket_info: string
          p_title: string
          p_venue_id: string
          p_website_url: string
        }
        Returns: undefined
      }
      admin_update_venue_metadata:
        | {
            Args: {
              p_best_for_tags: string[]
              p_booking_url: string
              p_contact_phone: string
              p_facilities: string[]
              p_notes_for_rr_team: string
              p_price_from: string
              p_short_tagline: string
              p_ticket_type: string
              p_venue_id: string
              p_website_url: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_best_for_tags: string[]
              p_booking_url: string
              p_contact_phone: string
              p_description: string
              p_facilities: string[]
              p_notes_for_rr_team: string
              p_price_from: string
              p_short_tagline: string
              p_ticket_type: string
              p_venue_id: string
              p_website_url: string
            }
            Returns: undefined
          }
      admin_warn_user: {
        Args: {
          p_duration_hours?: number
          p_reason: string
          p_severity?: Database["public"]["Enums"]["warning_severity"]
          p_user_id: string
        }
        Returns: string
      }
      assert_moderation_allowed: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      block_profile: {
        Args: { p_blocked_id: string; p_reason?: string }
        Returns: undefined
      }
      check_email_exists: { Args: { email_to_check: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_attempts: number
          p_user_id: string
          p_window_minutes: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      create_comment_with_rate_limit: {
        Args: {
          p_body: string
          p_catch_id: string
          p_parent_comment_id?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_actor_id?: string
          p_catch_id?: string
          p_comment_id?: string
          p_extra_data?: Json
          p_message: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      create_report_with_rate_limit: {
        Args: {
          p_details?: string
          p_reason: string
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Returns: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      follow_profile_with_rate_limit: {
        Args: { p_following_id: string }
        Returns: string
      }
      get_catch_rating_summary: {
        Args: { p_catch_id: string }
        Returns: {
          average_rating: number
          catch_id: string
          rating_count: number
          your_rating: number
        }[]
      }
      get_follower_count: { Args: { p_profile_id: string }; Returns: number }
      get_my_venue_rating: {
        Args: { p_venue_id: string }
        Returns: {
          user_rating: number
          venue_id: string
        }[]
      }
      get_rate_limit_status: {
        Args: {
          p_action: string
          p_max_attempts: number
          p_user_id: string
          p_window_minutes: number
        }
        Returns: {
          attempts_remaining: number
          attempts_used: number
          is_limited: boolean
          reset_at: string
        }[]
      }
      get_venue_by_slug: {
        Args: { p_slug: string }
        Returns: {
          avg_rating: number
          best_for_tags: string[]
          booking_url: string
          contact_phone: string
          created_at: string
          description: string
          facilities: string[]
          headline_pb_species: string
          headline_pb_unit: Database["public"]["Enums"]["weight_unit"]
          headline_pb_weight: number
          id: string
          is_published: boolean
          location: string
          name: string
          notes_for_rr_team: string
          price_from: string
          rating_count: number
          recent_catches_30d: number
          short_tagline: string
          slug: string
          ticket_type: string
          top_species: string[]
          total_catches: number
          updated_at: string
          website_url: string
        }[]
      }
      get_venue_past_events: {
        Args: {
          p_limit?: number
          p_now?: string
          p_offset?: number
          p_venue_id: string
        }
        Returns: {
          booking_url: string
          created_at: string
          description: string
          ends_at: string
          event_type: string
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string
          title: string
          updated_at: string
          venue_id: string
          website_url: string
        }[]
      }
      get_venue_photos: {
        Args: { p_limit?: number; p_offset?: number; p_venue_id: string }
        Returns: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          image_path: string
          venue_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "venue_photos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_venue_recent_catches: {
        Args: { p_limit?: number; p_offset?: number; p_venue_id: string }
        Returns: {
          comments: Json
          conditions: Json
          created_at: string
          hide_exact_spot: boolean
          id: string
          image_url: string
          location: string
          profiles: Json
          ratings: Json
          reactions: Json
          species: string
          title: string
          user_id: string
          venues: Json
          visibility: Database["public"]["Enums"]["visibility_type"]
          weight: number
          weight_unit: Database["public"]["Enums"]["weight_unit"]
        }[]
      }
      get_venue_top_anglers: {
        Args: { p_limit?: number; p_venue_id: string }
        Returns: {
          avatar_path: string
          avatar_url: string
          best_weight: number
          best_weight_unit: Database["public"]["Enums"]["weight_unit"]
          catch_count: number
          last_catch_at: string
          user_id: string
          username: string
        }[]
      }
      get_venue_top_catches: {
        Args: { p_limit?: number; p_venue_id: string }
        Returns: {
          comments: Json
          conditions: Json
          created_at: string
          hide_exact_spot: boolean
          id: string
          image_url: string
          location: string
          profiles: Json
          ratings: Json
          reactions: Json
          species: string
          title: string
          user_id: string
          venues: Json
          visibility: Database["public"]["Enums"]["visibility_type"]
          weight: number
          weight_unit: Database["public"]["Enums"]["weight_unit"]
        }[]
      }
      get_venue_upcoming_events: {
        Args: { p_limit?: number; p_now?: string; p_venue_id: string }
        Returns: {
          booking_url: string
          created_at: string
          description: string
          ends_at: string
          event_type: string
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string
          title: string
          updated_at: string
          venue_id: string
          website_url: string
        }[]
      }
      get_venues: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          avg_rating: number
          best_for_tags: string[]
          created_at: string
          description: string
          facilities: string[]
          headline_pb_species: string
          headline_pb_unit: Database["public"]["Enums"]["weight_unit"]
          headline_pb_weight: number
          id: string
          is_published: boolean
          location: string
          name: string
          price_from: string
          rating_count: number
          recent_catches_30d: number
          short_tagline: string
          slug: string
          ticket_type: string
          top_species: string[]
          total_catches: number
          updated_at: string
        }[]
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_blocked_either_way: {
        Args: { p_other_id: string; p_user_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { p_follower: string; p_following: string }
        Returns: boolean
      }
      is_venue_admin_or_owner: {
        Args: { p_venue_id: string }
        Returns: boolean
      }
      owner_add_venue_photo: {
        Args: { p_caption?: string; p_image_path: string; p_venue_id: string }
        Returns: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          image_path: string
          venue_id: string
        }
        SetofOptions: {
          from: "*"
          to: "venue_photos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      owner_create_venue_event: {
        Args: {
          p_booking_url: string
          p_contact_phone: string
          p_description: string
          p_ends_at: string
          p_event_type: string
          p_is_published?: boolean
          p_starts_at: string
          p_ticket_info: string
          p_title: string
          p_venue_id: string
          p_website_url: string
        }
        Returns: {
          booking_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string | null
          title: string
          updated_at: string
          venue_id: string
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "venue_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      owner_delete_venue_event: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      owner_delete_venue_photo: { Args: { p_id: string }; Returns: undefined }
      owner_get_venue_events: {
        Args: { p_venue_id: string }
        Returns: {
          booking_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string | null
          title: string
          updated_at: string
          venue_id: string
          website_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "venue_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      owner_update_venue_event: {
        Args: {
          p_booking_url: string
          p_contact_phone: string
          p_description: string
          p_ends_at: string
          p_event_id: string
          p_event_type: string
          p_is_published?: boolean
          p_starts_at: string
          p_ticket_info: string
          p_title: string
          p_website_url: string
        }
        Returns: {
          booking_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_published: boolean
          starts_at: string
          ticket_info: string | null
          title: string
          updated_at: string
          venue_id: string
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "venue_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      owner_update_venue_metadata: {
        Args: {
          p_best_for_tags: string[]
          p_booking_url: string
          p_contact_phone: string
          p_description: string
          p_facilities: string[]
          p_price_from: string
          p_tagline: string
          p_ticket_type: string
          p_venue_id: string
          p_website_url: string
        }
        Returns: {
          best_for_tags: string[] | null
          booking_url: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facilities: string[] | null
          id: string
          is_published: boolean
          location: string | null
          name: string
          notes_for_rr_team: string | null
          price_from: string | null
          short_tagline: string | null
          slug: string
          ticket_type: string | null
          updated_at: string
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "venues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rate_catch_with_rate_limit: {
        Args: { p_catch_id: string; p_rating: number }
        Returns: string
      }
      react_to_catch_with_rate_limit: {
        Args: { p_catch_id: string; p_reaction?: string }
        Returns: boolean
      }
      request_account_deletion: { Args: { p_reason?: string }; Returns: Json }
      request_account_export: { Args: never; Returns: Json }
      soft_delete_comment: {
        Args: { p_comment_id: string }
        Returns: undefined
      }
      unblock_profile: { Args: { p_blocked_id: string }; Returns: undefined }
      upsert_venue_rating: {
        Args: { p_rating: number; p_venue_id: string }
        Returns: {
          avg_rating: number
          rating_count: number
          user_rating: number
          venue_id: string
        }[]
      }
      user_rate_limits:
        | {
            Args: { p_user_id: string }
            Returns: {
              action: string
              count: number
              newest_attempt: string
              oldest_attempt: string
            }[]
          }
        | {
            Args: never
            Returns: {
              action: string
              count: number
              newest_attempt: string
              oldest_attempt: string
            }[]
          }
    }
    Enums: {
      length_unit: "cm" | "in"
      mod_action:
        | "delete_catch"
        | "delete_comment"
        | "restore_catch"
        | "restore_comment"
        | "warn_user"
        | "suspend_user"
      notification_type:
        | "new_follower"
        | "new_comment"
        | "new_rating"
        | "new_reaction"
        | "mention"
        | "admin_report"
        | "admin_warning"
        | "admin_moderation"
        | "comment_reply"
      reaction_type: "like" | "love" | "fire"
      report_status: "open" | "resolved" | "dismissed"
      report_target_type: "catch" | "comment" | "profile"
      time_of_day: "morning" | "afternoon" | "evening" | "night"
      visibility_type: "public" | "followers" | "private"
      warning_severity: "warning" | "temporary_suspension" | "permanent_ban"
      weight_unit: "lb_oz" | "kg" | "g"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      length_unit: ["cm", "in"],
      mod_action: [
        "delete_catch",
        "delete_comment",
        "restore_catch",
        "restore_comment",
        "warn_user",
        "suspend_user",
      ],
      notification_type: [
        "new_follower",
        "new_comment",
        "new_rating",
        "new_reaction",
        "mention",
        "admin_report",
        "admin_warning",
        "admin_moderation",
        "comment_reply",
      ],
      reaction_type: ["like", "love", "fire"],
      report_status: ["open", "resolved", "dismissed"],
      report_target_type: ["catch", "comment", "profile"],
      time_of_day: ["morning", "afternoon", "evening", "night"],
      visibility_type: ["public", "followers", "private"],
      warning_severity: ["warning", "temporary_suspension", "permanent_ban"],
      weight_unit: ["lb_oz", "kg", "g"],
    },
  },
} as const

