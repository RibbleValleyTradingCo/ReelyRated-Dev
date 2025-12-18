import type { Database as GeneratedDatabase, Json } from "@/lib/database.types";

export type Database = GeneratedDatabase;
export type { Json };

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

// Enum aliases (legacy convenience)
export type VisibilityType = Enums<"visibility_type">;
export type WeightUnit = Enums<"weight_unit">;
export type LengthUnit = "cm" | "in";
export type TimeOfDay = Enums<"time_of_day">;
export type NotificationType = Enums<"notification_type">;
export type ReportStatus = Enums<"report_status">;
export type ReportTargetType = Enums<"report_target_type">;
export type WarningSeverity = Enums<"warning_severity">;
export type ModerationStatus = "active" | "warned" | "suspended" | "banned";
export type ModAction = Enums<"mod_action">;
export type ReactionType = Enums<"reaction_type">;

// Table aliases (legacy convenience)
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type CatchRow = Database["public"]["Tables"]["catches"]["Row"];
export type CatchInsert = Database["public"]["Tables"]["catches"]["Insert"];
export type CatchUpdate = Database["public"]["Tables"]["catches"]["Update"];

export type CatchCommentRow = Database["public"]["Tables"]["catch_comments"]["Row"];
export type CatchCommentInsert = Database["public"]["Tables"]["catch_comments"]["Insert"];
export type CatchCommentUpdate = Database["public"]["Tables"]["catch_comments"]["Update"];

export type CatchReactionRow = Database["public"]["Tables"]["catch_reactions"]["Row"];
export type CatchReactionInsert = Database["public"]["Tables"]["catch_reactions"]["Insert"];
export type CatchReactionUpdate = Database["public"]["Tables"]["catch_reactions"]["Update"];

export type RatingRow = Database["public"]["Tables"]["ratings"]["Row"];
export type RatingInsert = Database["public"]["Tables"]["ratings"]["Insert"];
export type RatingUpdate = Database["public"]["Tables"]["ratings"]["Update"];

export type ProfileFollowRow = Database["public"]["Tables"]["profile_follows"]["Row"];
export type ProfileFollowInsert = Database["public"]["Tables"]["profile_follows"]["Insert"];
export type ProfileFollowUpdate = Database["public"]["Tables"]["profile_follows"]["Update"];

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
export type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];

export type AdminUserRow = Database["public"]["Tables"]["admin_users"]["Row"];

export type UserWarningRow = Database["public"]["Tables"]["user_warnings"]["Row"];
export type UserWarningInsert = Database["public"]["Tables"]["user_warnings"]["Insert"];
export type UserWarningUpdate = Database["public"]["Tables"]["user_warnings"]["Update"];

export type ModerationLogRow = Database["public"]["Tables"]["moderation_log"]["Row"];
export type ModerationLogInsert = Database["public"]["Tables"]["moderation_log"]["Insert"];
export type ModerationLogUpdate = Database["public"]["Tables"]["moderation_log"]["Update"];

export type RateLimitRow = Database["public"]["Tables"]["rate_limits"]["Row"];
export type RateLimitInsert = Database["public"]["Tables"]["rate_limits"]["Insert"];
export type RateLimitUpdate = Database["public"]["Tables"]["rate_limits"]["Update"];

export type TagRow = Database["public"]["Tables"]["tags"]["Row"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
export type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

export type BaitRow = Database["public"]["Tables"]["baits"]["Row"];
export type BaitInsert = Database["public"]["Tables"]["baits"]["Insert"];
export type BaitUpdate = Database["public"]["Tables"]["baits"]["Update"];

export type WaterTypeRow = Database["public"]["Tables"]["water_types"]["Row"];
export type WaterTypeInsert = Database["public"]["Tables"]["water_types"]["Insert"];
export type WaterTypeUpdate = Database["public"]["Tables"]["water_types"]["Update"];

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

// Species table is not present in the generated schema; keep a minimal shape for domain usage.
export type SpeciesRow = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: string | null;
  record_weight: number | null;
  record_weight_unit: WeightUnit | null;
  image_url: string | null;
  created_at: string;
};

export type VenueRow = Tables<"venues">;
