# Test Data – Local Docker

Environment: Local Docker (Supabase + Vite dev)  
DB: Fresh local DB – test users only

## Test Users

> IDs are `auth.users.id` and should match `public.profiles.id`.

- **User A – test1**

  - Email: `test1@example.com` (or whatever you used)
  - ID: `b1eda16a-e1e7-4184-868e-5f994f0f1863`

- **User B – test2**

  - Email: `test2@example.com`
  - ID: `17f4160f-f4f3-4b0f-b84e-533b49e5ad84`

- **User C – test3**

  - Email: `test3@example.com`
  - ID: `32d019ec-4643-4ac6-ab8c-e6cb69bf63de`

- **Bonus Admin User**
  - Email: `admin@example.com` (or your real admin test email)
  - ID: `97d5b489-7c3e-4b47-bcec-9c84c4756c30`
  - Notes:
    - Must exist in `public.admin_users` with `user_id = 97d5b4...6c30`
    - Used for admin/moderation / venue-owner tests
