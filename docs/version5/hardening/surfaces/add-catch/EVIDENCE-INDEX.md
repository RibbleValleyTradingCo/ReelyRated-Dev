# Evidence Index

| Evidence ID | Type (HAR/SQL/Shot) | Persona | Scenario | File path | Notes |
| --- | --- | --- | --- | --- | --- |
| AC-ANON-ROUTE-DENY-HAR | HAR | Anon | Visit `/add-catch` and confirm redirect to `/auth` | `docs/version5/hardening/surfaces/add-catch/evidence/har/AC-ANON-ROUTE-DENY.har` | Capture 302/redirect chain. |
| AC-ANON-ROUTE-DENY-SHOT | Shot | Anon | `/auth` screen after redirect | `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/AC-ANON-ROUTE-DENY.png` | Include URL bar. |
| AC-AUTH-SUCCESS-HAR | HAR | Normal | Successful add-catch flow | `docs/version5/hardening/surfaces/add-catch/evidence/har/AC-AUTH-SUCCESS.har` | Should include venues lookup, sessions list/create, storage upload, catches insert. |
| AC-AUTH-SUCCESS-SHOT-01 | Shot | Normal | Completed form before submit | `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/AC-AUTH-SUCCESS-FORM.png` | Show key fields + image preview. |
| AC-AUTH-SUCCESS-SHOT-02 | Shot | Normal | Success toast + redirect to `/feed` | `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/AC-AUTH-SUCCESS-TOAST.png` | Confirm navigation target. |
| AC-STORAGE-UPLOAD-HAR | HAR | Normal | Storage upload request(s) to `catches` bucket | `docs/version5/hardening/surfaces/add-catch/evidence/har/AC-STORAGE-UPLOAD.har` | Note object key(s) in request path. |
| AC-STORAGE-OBJECT-PATH-SHOT | Shot | Normal | Storage object path evidence | `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/AC-STORAGE-OBJECT-PATH.png` | Show bucket + object key. |
| AC-DB-CATCH-OWNERSHIP-SQL | SQL | Normal | Verify catches row ownership + venue_id/session_id | `docs/version5/hardening/surfaces/add-catch/evidence/sql/AC-CATCH-OWNERSHIP.sql` | Query includes `id,user_id,venue_id,session_id,image_url`. |
| AC-DB-SESSION-INSERT-SQL | SQL | Normal | Verify session row created (if used) | `docs/version5/hardening/surfaces/add-catch/evidence/sql/AC-SESSION-INSERT.sql` | Only if “Create session” used. |
| AC-IDOR-USERID-HAR | HAR | Normal | Attempt insert with `user_id` != auth.uid | `docs/version5/hardening/surfaces/add-catch/evidence/har/AC-IDOR-USERID.har` | Expect RLS denial. |
| AC-IDOR-USERID-SHOT | Shot | Normal | Error UI for IDOR `user_id` attempt | `docs/version5/hardening/surfaces/add-catch/evidence/screenshots/AC-IDOR-USERID.png` | Capture error message. |
| AC-IDOR-VENUEID-HAR | HAR | Normal | Attempt insert with unauthorized `venue_id` | `docs/version5/hardening/surfaces/add-catch/evidence/har/AC-IDOR-VENUEID.har` | Expect RLS denial (or note actual behavior). |
| AC-SQL-GRANTS | SQL | Admin | Grants on touched tables | `docs/version5/hardening/surfaces/add-catch/evidence/sql/AC-GRANTS.sql` | `admin_users,tags,baits,water_types,venues,sessions,catches`. |
| AC-SQL-RLS-POLICIES | SQL | Admin | RLS policies for touched tables | `docs/version5/hardening/surfaces/add-catch/evidence/sql/AC-RLS-POLICIES.sql` | Include `catches_owner_mutate`, `sessions_*`. |
| AC-SQL-STORAGE-POLICIES | SQL | Admin | Storage policies for `catches` bucket | `docs/version5/hardening/surfaces/add-catch/evidence/sql/AC-STORAGE-POLICIES.sql` | `storage.objects` policies. |
