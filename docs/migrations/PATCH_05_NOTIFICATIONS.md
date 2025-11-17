# PATCH 05: Notifications Updates

## Overview
Updates notification system to align with new schema structure and field names.

## Files Affected
- `src/lib/notifications.ts`
- `src/hooks/useNotifications.ts`

## Schema Changes Summary

### notifications table
**Old Schema:**
```sql
id UUID
user_id UUID
type TEXT
data JSON
is_read BOOLEAN
created_at TIMESTAMPTZ
```

**New Schema:**
```sql
id UUID
user_id UUID (recipient)
actor_id UUID (who triggered it)
type notification_type ENUM
message TEXT (required)
catch_id UUID (optional FK)
comment_id UUID (optional FK)
extra_data JSONB
is_read BOOLEAN
read_at TIMESTAMPTZ
created_at TIMESTAMPTZ
```

### Key Changes:
1. **Type System:** `type` is now an ENUM instead of free text
2. **Structure:** `message` is now a dedicated field (was in `data`)
3. **References:** Dedicated `catch_id` and `comment_id` FKs
4. **Actor Tracking:** New `actor_id` field for who triggered the notification
5. **Read Tracking:** New `read_at` timestamp field
6. **Data Storage:** `data` → `extra_data` (JSON → JSONB)

## Notification Type ENUM
```sql
CREATE TYPE notification_type AS ENUM (
  'new_follower',
  'new_comment',
  'new_rating',
  'new_reaction',
  'mention',
  'system',
  'admin_report',
  'admin_warning'
);
```

## Required Changes

### src/lib/notifications.ts

#### Change 1: Update type imports
**Location:** Line 5-6

**Current:**
```typescript
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
```

**Updated:**
```typescript
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type NotificationType = Database["public"]["Enums"]["notification_type"];
```

#### Change 2: Update NotificationPayload interface
**Location:** Line 8-13

**Current:**
```typescript
export type NotificationPayload = {
  message: string;
  catchId?: string;
  commentId?: string;
  extraData?: Record<string, unknown>;
};
```

**Updated:**
```typescript
export type NotificationPayload = {
  message: string;
  actorId?: string;  // NEW: who triggered the notification
  catchId?: string;
  commentId?: string;
  extraData?: Record<string, unknown>;
};
```

#### Change 3: Update createNotification RPC call
**Location:** Line 39-46

**Current:**
```typescript
const { data, error } = await supabase.rpc("create_notification", {
  recipient_id: userId,
  event_type: type,
  message: payload.message,
  catch_target: payload.catchId ?? null,
  comment_target: payload.commentId ?? null,
  extra_data: serializeExtraData(payload.extraData),
});
```

**Updated:**
```typescript
const { data, error } = await supabase.rpc("create_notification", {
  recipient_id: userId,
  event_type: type,
  notification_message: payload.message,  // Renamed parameter
  actor_user_id: payload.actorId ?? null,  // NEW
  catch_target: payload.catchId ?? null,
  comment_target: payload.commentId ?? null,
  extra_data: serializeExtraData(payload.extraData),
});
```

**Note:** The RPC function signature may need updating in the database migration as well.

#### Change 4: Update notifyAdmins function
**Location:** Line 134-154

**Current:**
```typescript
export const notifyAdmins = async (data: NotificationInsert["data"]) => {
  const adminIds = await loadAdminUserIds();

  if (adminIds.length === 0) {
    logger.warn("No admin users configured to receive notifications");
    return;
  }

  await Promise.all(
    adminIds.map((adminId) =>
      createNotification({
        userId: adminId,
        type: "admin_report",
        payload: {
          message: data?.message ?? "A new report has been submitted.",
          extraData: data ?? undefined,
        },
      })
    )
  );
};
```

**Updated:**
```typescript
export const notifyAdmins = async (
  message: string,
  extraData?: Record<string, unknown>
) => {
  const adminIds = await loadAdminUserIds();

  if (adminIds.length === 0) {
    logger.warn("No admin users configured to receive notifications");
    return;
  }

  await Promise.all(
    adminIds.map((adminId) =>
      createNotification({
        userId: adminId,
        type: "admin_report",
        payload: {
          message,
          extraData,
        },
      })
    )
  );
};
```

### src/hooks/useNotifications.ts

**Status:** NO CHANGES REQUIRED

This file uses the Database types correctly and doesn't need updates. The internal structure changes are handled by the type definitions.

However, components using notifications may need to update how they access notification data:

**Old access pattern:**
```typescript
notification.data.message
notification.data.catchId
```

**New access pattern:**
```typescript
notification.message
notification.catch_id
notification.actor_id
notification.extra_data
```

## Complete Unified Diffs

### src/lib/notifications.ts
```diff
--- a/src/lib/notifications.ts
+++ b/src/lib/notifications.ts
@@ -4,6 +4,7 @@ import { logger } from "@/lib/logger";

 type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
 type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
+type NotificationType = Database["public"]["Enums"]["notification_type"];

 export type NotificationPayload = {
   message: string;
+  actorId?: string;
   catchId?: string;
   commentId?: string;
   extraData?: Record<string, unknown>;
 };

 interface CreateNotificationParams {
   userId: string;
-  type: NotificationInsert["type"];
+  type: NotificationType;
   payload: NotificationPayload;
 }

@@ -37,8 +39,9 @@ export const createNotification = async ({ userId, type, payload }: CreateNotif

     const { data, error } = await supabase.rpc("create_notification", {
       recipient_id: userId,
       event_type: type,
-      message: payload.message,
+      notification_message: payload.message,
+      actor_user_id: payload.actorId ?? null,
       catch_target: payload.catchId ?? null,
       comment_target: payload.commentId ?? null,
       extra_data: serializeExtraData(payload.extraData),
     });

@@ -130,23 +133,19 @@ const loadAdminUserIds = async () => {
   return cachedAdminIds;
 };

-export const notifyAdmins = async (data: NotificationInsert["data"]) => {
+export const notifyAdmins = async (
+  message: string,
+  extraData?: Record<string, unknown>
+) => {
   const adminIds = await loadAdminUserIds();

   if (adminIds.length === 0) {
     logger.warn("No admin users configured to receive notifications");
     return;
   }

   await Promise.all(
     adminIds.map((adminId) =>
       createNotification({
         userId: adminId,
         type: "admin_report",
-        payload: {
-          message: data?.message ?? "A new report has been submitted.",
-          extraData: data ?? undefined,
-        },
+        payload: { message, extraData },
       })
     )
   );
 };
```

## RPC Function Update Required

The `create_notification` RPC function needs to be updated to match the new schema:

```sql
CREATE OR REPLACE FUNCTION create_notification(
  recipient_id UUID,
  event_type notification_type,
  notification_message TEXT,
  actor_user_id UUID DEFAULT NULL,
  catch_target UUID DEFAULT NULL,
  comment_target UUID DEFAULT NULL,
  extra_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    message,
    catch_id,
    comment_id,
    extra_data
  ) VALUES (
    recipient_id,
    actor_user_id,
    event_type,
    notification_message,
    catch_target,
    comment_target,
    extra_data
  )
  RETURNING id INTO new_notification_id;

  RETURN new_notification_id;
END;
$$;
```

## Component Updates Required

Any components displaying notifications need updates:

### Example: NotificationItem Component
**Old:**
```typescript
<div className="notification">
  <p>{notification.data?.message}</p>
  {notification.data?.catchId && (
    <Link to={`/catch/${notification.data.catchId}`}>View catch</Link>
  )}
</div>
```

**New:**
```typescript
<div className="notification">
  <p>{notification.message}</p>
  {notification.catch_id && (
    <Link to={`/catch/${notification.catch_id}`}>View catch</Link>
  )}
  {notification.actor_id && (
    <span>From: {notification.actor_id}</span>
  )}
</div>
```

## Breaking Changes

1. **Field Structure:**
   - `data.message` → `message` (top-level field)
   - `data.catchId` → `catch_id` (top-level field)
   - `data.commentId` → `comment_id` (top-level field)
   - `data.*` → `extra_data.*` (for custom data)

2. **Type System:**
   - `type` is now strictly typed ENUM
   - Invalid types will cause runtime errors

3. **RPC Function:**
   - Parameter names changed
   - New `actor_user_id` parameter
   - `message` → `notification_message`

4. **notifyAdmins Signature:**
   - Changed from `notifyAdmins(data)` to `notifyAdmins(message, extraData)`

## Testing Recommendations

1. **Notification Creation**
   - ✓ Test each notification type (follower, comment, rating, etc.)
   - ✓ Verify actor_id is set correctly
   - ✓ Test catch_id and comment_id references
   - ✓ Test extra_data serialization

2. **Notification Display**
   - ✓ Verify message displays correctly
   - ✓ Test links to catch/comment work
   - ✓ Test actor information shows
   - ✓ Test read/unread states

3. **Admin Notifications**
   - ✓ Test report notifications to admins
   - ✓ Verify message and extra_data work
   - ✓ Test with no admin users configured

4. **Edge Cases**
   - ✓ Notifications without actor_id
   - ✓ Notifications without catch/comment
   - ✓ Notifications with complex extra_data
   - ✓ Invalid notification types (should error)

## Migration Strategy

1. **Database First:**
   - Run migration to update notifications table
   - Deploy RPC function updates

2. **Backend Updates:**
   - Update lib/notifications.ts
   - Update any backend notification creation code

3. **Frontend Updates:**
   - Update notification display components
   - Update field access patterns

4. **Testing:**
   - Test notification creation end-to-end
   - Verify old notifications still display (if any exist)

## Notes

- The new schema is more structured and type-safe
- `actor_id` enables better notification display (who did what)
- Dedicated `catch_id` and `comment_id` improve querying
- `read_at` timestamp useful for analytics
- JSONB `extra_data` more efficient than JSON

## Validation Checklist
- [ ] Update NotificationPayload interface
- [ ] Add actorId parameter to createNotification
- [ ] Update RPC call parameter names
- [ ] Update notifyAdmins function signature
- [ ] Deploy RPC function to database
- [ ] Update notification display components
- [ ] Change data.message to message
- [ ] Change data.catchId to catch_id
- [ ] Test all notification types
- [ ] Verify admin notifications work
