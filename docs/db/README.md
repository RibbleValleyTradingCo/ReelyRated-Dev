# DB snapshots (schema only)

This folder contains schema-only and roles snapshots of the Supabase database for reference.
Do not commit any production data dumps to this repo.

Files
- schema.sql: schema-only dump (tables, views, functions, policies)
- roles.sql: role definitions only
- data.sql: optional data-only dump (NOT COMMITTED)

Regenerate locally
Requirements:
- Supabase CLI installed
- SUPABASE_DB_URL set in your environment

Use npm scripts:
- npm run db:schema
- npm run db:roles
- npm run db:data (optional, do not commit)

Direct CLI equivalents:
- supabase db dump --db-url "$SUPABASE_DB_URL" -f docs/db/schema.sql
- supabase db dump --db-url "$SUPABASE_DB_URL" -f docs/db/roles.sql --role-only
- supabase db dump --db-url "$SUPABASE_DB_URL" -f docs/db/data.sql --data-only --use-copy

Warning
- Never commit docs/db/data.sql or any other data dump.
- These snapshots are for reference only.
