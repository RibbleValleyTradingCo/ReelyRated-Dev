-- 62_PUBLIC_ANON_DML_RECHECK.sql
-- Recheck for PUBLIC/anon DML grants in public schema (0 rows = PASS).
select
  tp.table_schema as schema_name,
  tp.table_name,
  tp.grantee,
  tp.privilege_type,
  'GATE_PUBLIC_ANON_DML_GRANT' as gate_id
from information_schema.table_privileges tp
where tp.table_schema = 'public'
  and tp.grantee in ('PUBLIC', 'anon')
  and tp.privilege_type in (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'REFERENCES',
    'TRIGGER'
  )
order by tp.table_schema, tp.table_name, tp.grantee, tp.privilege_type;
