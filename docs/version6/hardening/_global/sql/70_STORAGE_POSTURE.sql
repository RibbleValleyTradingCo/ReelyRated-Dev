-- 70_STORAGE_POSTURE.sql
-- Best-effort storage posture snapshot (single result set).
with buckets as (
  select
    'bucket' as record_type,
    b.id::text as bucket_id,
    b.name as bucket_name,
    b.public as bucket_public,
    b.owner::text as bucket_owner,
    b.created_at as bucket_created_at,
    null::text as policyname,
    null::text as polcmd,
    null::text as roles,
    null::text as qual,
    null::text as with_check,
    null::text as object_name,
    null::timestamptz as object_created_at
  from storage.buckets b
),
policies as (
  select
    'policy' as record_type,
    null::text as bucket_id,
    null::text as bucket_name,
    null::boolean as bucket_public,
    null::text as bucket_owner,
    null::timestamptz as bucket_created_at,
    pol.polname as policyname,
    case pol.polcmd
      when 'r'::"char" then 'SELECT'::text
      when 'a'::"char" then 'INSERT'::text
      when 'w'::"char" then 'UPDATE'::text
      when 'd'::"char" then 'DELETE'::text
      when '*'::"char" then 'ALL'::text
      else null::text
    end as polcmd,
    pol.polroles::regrole[]::text as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as qual,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check,
    null::text as object_name,
    null::timestamptz as object_created_at
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage'
    and c.relname = 'objects'
),
object_sample as (
  select
    'object_sample' as record_type,
    o.bucket_id::text as bucket_id,
    null::text as bucket_name,
    null::boolean as bucket_public,
    null::text as bucket_owner,
    null::timestamptz as bucket_created_at,
    null::text as policyname,
    null::text as polcmd,
    null::text as roles,
    null::text as qual,
    null::text as with_check,
    o.name as object_name,
    o.created_at as object_created_at
  from storage.objects o
  order by o.created_at desc
  limit 25
)
select * from buckets
union all
select * from policies
union all
select * from object_sample
order by record_type, bucket_id nulls last, policyname nulls last, object_created_at nulls last;
