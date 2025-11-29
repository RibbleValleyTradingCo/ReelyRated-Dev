-- 2053_profile_blocks_schema.sql
-- Adds profile_blocks table for block/mute groundwork (see docs/BLOCK-MUTE-DESIGN.md, Phase 2.3 in docs/FEATURE-ROADMAP.md)

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.profile_blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_blocks_pkey PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_blocks_blocker_id ON public.profile_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_profile_blocks_blocked_id ON public.profile_blocks (blocked_id);

COMMENT ON TABLE public.profile_blocks IS 'Hard block list between profiles (see docs/BLOCK-MUTE-DESIGN.md).';
COMMENT ON COLUMN public.profile_blocks.blocker_id IS 'Profile initiating the block (see docs/BLOCK-MUTE-DESIGN.md).';
COMMENT ON COLUMN public.profile_blocks.blocked_id IS 'Profile being blocked (see docs/BLOCK-MUTE-DESIGN.md).';
COMMENT ON COLUMN public.profile_blocks.reason IS 'Optional internal note for the block (see docs/BLOCK-MUTE-DESIGN.md).';
COMMENT ON COLUMN public.profile_blocks.created_at IS 'Timestamp when the block was created (see docs/BLOCK-MUTE-DESIGN.md).';

-- RLS/policy TODO (not implemented here): restrict visibility/modification to blocker_id and admins; enforce in feed/search/follow RPCs.
