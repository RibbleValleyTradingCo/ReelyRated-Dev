-- 2049_account_deletion_schema_prep.sql
-- Groundwork for account deletion/export (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md)
-- Adds deletion flags on profiles and documents future deletion/anonymisation behaviour.

SET search_path = public, extensions;

-- Profiles: soft-delete/anonymisation flags
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_for_deletion BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.deleted_at IS 'Account deletion prep: soft-delete timestamp (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';
COMMENT ON COLUMN public.profiles.is_deleted IS 'Account deletion prep flag to exclude deleted users (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';
COMMENT ON COLUMN public.profiles.locked_for_deletion IS 'Prevents new activity while deletion runs (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles (is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles (deleted_at);

-- Catches: existing soft-delete column will be used by account deletion flows
COMMENT ON COLUMN public.catches.deleted_at IS 'Soft-delete for catches; used when accounts are deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

-- Catch comments: existing soft-delete column will be used for tombstoning
COMMENT ON COLUMN public.catch_comments.deleted_at IS 'Soft-delete for comments; will be tombstoned on account deletion (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

-- Ratings/Reactions: future decision to delete or anonymise rows for deleted accounts
COMMENT ON TABLE public.catch_reactions IS 'Account deletion may delete or anonymise user_id rows in a later migration (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';
COMMENT ON TABLE public.ratings IS 'Account deletion may delete or anonymise user_id rows in a later migration (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

-- Audit/notifications: preserved for history; behaviour defined in design doc
COMMENT ON TABLE public.reports IS 'Preserve for audit even if reporter/target account is deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';
COMMENT ON TABLE public.user_warnings IS 'Preserve for audit even if account is deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';
COMMENT ON TABLE public.moderation_log IS 'Preserve for audit even if account is deleted (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';
COMMENT ON TABLE public.notifications IS 'Rows for deleted users may be cleared; other users’ rows remain (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

-- RLS notes (non-functional): future tightening to exclude deleted accounts/content
COMMENT ON POLICY catches_public_read ON public.catches IS 'TODO: future tighten to exclude deleted/hidden catches for deleted accounts per docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md.';
COMMENT ON POLICY catch_comments_public_read ON public.catch_comments IS 'TODO: future tighten to exclude deleted comments and deleted accounts per docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md.';
COMMENT ON POLICY profiles_select_all ON public.profiles IS 'TODO: future filter out is_deleted profiles from search/feed surfaces per docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md.';
