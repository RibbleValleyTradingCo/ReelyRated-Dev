-- 2174_pin_search_path_for_mutable_functions.sql
-- Purpose: pin search_path for specific public functions flagged by advisor (no behavior change).
-- Scope: public.insights_format_label, public.set_updated_at, public.is_blocked_either_way.

BEGIN;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    select
      p.oid::regprocedure::text as regproc,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'insights_format_label',
        'set_updated_at',
        'is_blocked_either_way'
      )
      and p.prokind = 'f'
    order by p.proname, identity_args
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = %L',
      r.regproc,
      'public, extensions'
    );
  END LOOP;
END;
$$;

COMMIT;
