# PATCH 06: Admin & Moderation Updates

## Overview
Updates admin and moderation functionality to align with new schema structure, including reports, warnings, and moderation logs.

## Files Affected
- `src/pages/AdminReports.tsx`
- `src/lib/admin.ts`

## Schema Changes Summary

### profiles table (moderation fields)
```sql
-- Added moderation tracking fields
warn_count INTEGER DEFAULT 0
moderation_status moderation_status ENUM
suspension_until TIMESTAMPTZ
```

### reports table
**Old Schema:**
```sql
id UUID
target_type TEXT
target_id UUID
reason TEXT
status TEXT
created_at TIMESTAMPTZ
reporter_id UUID
```

**New Schema:**
```sql
id UUID
reporter_id UUID
target_type report_target_type ENUM ('catch', 'comment', 'profile')
target_id UUID
reason TEXT
status report_status ENUM ('open', 'in_review', 'resolved', 'dismissed')
resolved_at TIMESTAMPTZ
resolved_by UUID
notes TEXT
created_at TIMESTAMPTZ
```

### admin_users table
**Old Schema:**
```sql
user_id UUID PRIMARY KEY
created_at TIMESTAMPTZ
```

**New Schema:**
```sql
user_id UUID PRIMARY KEY REFERENCES profiles(user_id)
granted_by UUID REFERENCES profiles(user_id)
granted_at TIMESTAMPTZ DEFAULT NOW()
created_at TIMESTAMPTZ DEFAULT NOW()
```

### user_warnings table (NEW)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles(user_id)
admin_id UUID REFERENCES profiles(user_id)
reason TEXT
severity warning_severity ENUM
duration_hours INTEGER
created_at TIMESTAMPTZ
```

### moderation_log table (NEW)
```sql
id UUID PRIMARY KEY
admin_id UUID REFERENCES profiles(user_id)
action mod_action ENUM
target_type TEXT
target_id UUID
reason TEXT
details JSONB
created_at TIMESTAMPTZ
```

### catch_comments table (soft delete)
```sql
-- Added field
deleted_at TIMESTAMPTZ
```

## Required Changes

### src/pages/AdminReports.tsx

#### Change 1: Update type definitions
**Location:** Line 43-62

**Current:**
```typescript
type SeverityOption = "warning" | "temporary_suspension" | "permanent_ban";
type ReportStatus = "open" | "resolved" | "dismissed";

interface Reporter {
  id: string;
  username: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
}

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter: Reporter | null;
}
```

**Updated:**
```typescript
import type { Database } from "@/integrations/supabase/types";

type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type ReportStatus = Database["public"]["Enums"]["report_status"];
type ReportTargetType = Database["public"]["Enums"]["report_target_type"];
type SeverityOption = Database["public"]["Enums"]["warning_severity"];
type ModerationStatus = Database["public"]["Enums"]["moderation_status"];

// Extended type with joined profile
interface ReportWithReporter extends ReportRow {
  reporter: {
    user_id: string;
    username: string | null;
    avatar_path: string | null;
    avatar_url: string | null;
  } | null;
}
```

#### Change 2: Update reports SELECT query
**Location:** Line 161-166

**Current:**
```typescript
const { data, error } = await supabase
  .from("reports")
  .select(
    "id, target_type, target_id, reason, status, created_at, reporter:reporter_id (id, username, avatar_path, avatar_url)"
  )
  .order("created_at", { ascending: false });
```

**Updated:**
```typescript
const { data, error } = await supabase
  .from("reports")
  .select(`
    id, target_type, target_id, reason, status,
    resolved_at, resolved_by, notes, created_at,
    reporter:reporter_id (
      user_id, username, full_name, avatar_path, avatar_url
    )
  `)
  .order("created_at", { ascending: false });
```

#### Change 3: Update catches soft delete check
**Location:** Line 266-271

**Current:**
```typescript
const { data, error } = await supabase
  .from("catches")
  .select("id, user_id, deleted_at")
  .eq("id", report.target_id)
  .maybeSingle();
```

**Note:** This is already correct - just ensure we're checking `deleted_at` field exists.

#### Change 4: Update profiles query
**Location:** Line 305-310

**Current:**
```typescript
const { data: profileRow, error: profileError } = await supabase
  .from("profiles")
  .select("id, username, warn_count, moderation_status, suspension_until")
  .eq("id", targetUserId)
  .maybeSingle();
```

**Updated:**
```typescript
const { data: profileRow, error: profileError } = await supabase
  .from("profiles")
  .select("user_id, username, warn_count, moderation_status, suspension_until")
  .eq("user_id", targetUserId)
  .maybeSingle();
```

#### Change 5: Update user_warnings query
**Location:** Line 324-329

**Current:**
```typescript
const warningsResponse = targetUserId
  ? await supabase
      .from("user_warnings")
      .select("id, reason, severity, duration_hours, created_at, admin:admin_id (id, username)")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
  : { data: [] as unknown[], error: null };
```

**Updated:**
```typescript
const warningsResponse = targetUserId
  ? await supabase
      .from("user_warnings")
      .select(`
        id, reason, severity, duration_hours, created_at,
        admin:admin_id (user_id, username)
      `)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
  : { data: [] as unknown[], error: null };
```

#### Change 6: Update moderation_log query
**Location:** Line 333-338

**Current:**
```typescript
const historyResponse = await supabase
  .from("moderation_log")
  .select("id, action, target_type, target_id, reason, details, created_at, admin:admin_id (id, username)")
  .eq("target_id", report.target_id)
  .order("created_at", { ascending: false });
```

**Updated:**
```typescript
const historyResponse = await supabase
  .from("moderation_log")
  .select(`
    id, action, target_type, target_id, reason, details, created_at,
    admin:admin_id (user_id, username)
  `)
  .eq("target_id", report.target_id)
  .order("created_at", { ascending: false });
```

#### Change 7: Update targetProfile assignment
**Location:** Line 314

**Current:**
```typescript
targetProfile = { id: profileRow.id, username: profileRow.username };
```

**Updated:**
```typescript
targetProfile = { id: profileRow.user_id, username: profileRow.username };
```

#### Change 8: Update reporter display
**Location:** Line 727-729

**Current:**
```typescript
<p className="mt-2 text-xs text-muted-foreground">
  Reported by {report.reporter?.username ?? report.reporter?.id ?? "Unknown"}
</p>
```

**Updated:**
```typescript
<p className="mt-2 text-xs text-muted-foreground">
  Reported by {report.reporter?.username ?? report.reporter?.user_id ?? "Unknown"}
</p>
```

#### Change 9: Update admin username display in warnings
**Location:** Line 799-800

**Current:**
```typescript
{warning.admin && (
  <div className="text-[11px] text-muted-foreground">
    By {warning.admin.username ?? warning.admin.id ?? "admin"}
  </div>
)}
```

**Updated:**
```typescript
{warning.admin && (
  <div className="text-[11px] text-muted-foreground">
    By {warning.admin.username ?? warning.admin.user_id ?? "admin"}
  </div>
)}
```

#### Change 10: Update moderation history display
**Location:** Line 868-870

**Current:**
```typescript
<div className="font-medium">
  {entry.admin?.username ?? entry.admin?.id ?? "Unknown admin"} – {entry.action}
</div>
```

**Updated:**
```typescript
<div className="font-medium">
  {entry.admin?.username ?? entry.admin?.user_id ?? "Unknown admin"} – {entry.action}
</div>
```

### src/lib/admin.ts

**Status:** MINOR UPDATES REQUIRED

#### Change 1: Update admin_users query
**Location:** Line 25-29

**Current:**
```typescript
const { data, error } = await supabase
  .from('admin_users')
  .select('user_id')
  .eq('user_id', userId)
  .maybeSingle();
```

**Note:** This is already correct - the schema change doesn't affect this query.

**Potential Enhancement:**
```typescript
// Could add granted_by and granted_at for audit trails
const { data, error } = await supabase
  .from('admin_users')
  .select('user_id, granted_by, granted_at')
  .eq('user_id', userId)
  .maybeSingle();
```

## Complete Unified Diffs

### src/pages/AdminReports.tsx
```diff
--- a/src/pages/AdminReports.tsx
+++ b/src/pages/AdminReports.tsx
@@ -40,23 +40,17 @@ import {
   SelectValue,
 } from "@/components/ui/select";

-type SeverityOption = "warning" | "temporary_suspension" | "permanent_ban";
-type ReportStatus = "open" | "resolved" | "dismissed";
+import type { Database } from "@/integrations/supabase/types";

-interface Reporter {
-  id: string;
-  username: string | null;
-  avatar_path: string | null;
-  avatar_url: string | null;
-}
+type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
+type ReportStatus = Database["public"]["Enums"]["report_status"];
+type ReportTargetType = Database["public"]["Enums"]["report_target_type"];
+type SeverityOption = Database["public"]["Enums"]["warning_severity"];
+type ModerationStatus = Database["public"]["Enums"]["moderation_status"];

-interface ReportRow {
-  id: string;
-  target_type: string;
-  target_id: string;
-  reason: string;
-  status: ReportStatus;
-  created_at: string;
-  reporter: Reporter | null;
+interface ReportWithReporter extends ReportRow {
+  reporter: {
+    user_id: string;
+    username: string | null;
+    avatar_path: string | null;
+    avatar_url: string | null;
+  } | null;
 }

@@ -70,7 +64,7 @@ interface UserWarningEntry {
   severity: SeverityOption;
   duration_hours: number | null;
   created_at: string;
-  admin: { id: string | null; username: string | null } | null;
+  admin: { user_id: string | null; username: string | null } | null;
 }

@@ -85,7 +79,7 @@ interface ModerationLogEntry {
   reason: string;
   details: Record<string, unknown> | null;
   created_at: string;
-  admin: { id: string | null; username: string | null } | null;
+  admin: { user_id: string | null; username: string | null } | null;
 }

@@ -100,7 +94,7 @@ interface WarningQueryRow {
   severity: string;
   duration_hours: number | null;
   created_at: string;
-  admin: { id: string | null; username: string | null } | null;
+  admin: { user_id: string | null; username: string | null } | null;
 }

@@ -111,7 +105,7 @@ interface ModerationLogQueryRow {
   reason: string;
   details: Record<string, unknown> | null;
   created_at: string;
-  admin: { id: string | null; username: string | null } | null;
+  admin: { user_id: string | null; username: string | null } | null;
 }

@@ -161,9 +155,13 @@ const AdminReports = () => {

       const { data, error } = await supabase
         .from("reports")
-        .select(
-          "id, target_type, target_id, reason, status, created_at, reporter:reporter_id (id, username, avatar_path, avatar_url)"
-        )
+        .select(`
+          id, target_type, target_id, reason, status,
+          resolved_at, resolved_by, notes, created_at,
+          reporter:reporter_id (
+            user_id, username, full_name, avatar_path, avatar_url
+          )
+        `)
         .order("created_at", { ascending: false });

       if (error) {
@@ -305,8 +303,8 @@ const AdminReports = () => {
       if (targetUserId) {
         const { data: profileRow, error: profileError } = await supabase
           .from("profiles")
-          .select("id, username, warn_count, moderation_status, suspension_until")
-          .eq("id", targetUserId)
+          .select("user_id, username, warn_count, moderation_status, suspension_until")
+          .eq("user_id", targetUserId)
           .maybeSingle();

         if (profileError) throw profileError;
@@ -314,7 +312,7 @@ const AdminReports = () => {
         if (profileRow) {
-          targetProfile = { id: profileRow.id, username: profileRow.username };
+          targetProfile = { id: profileRow.user_id, username: profileRow.username };
           warnCount = profileRow.warn_count ?? 0;
           moderationStatus = profileRow.moderation_status ?? "active";
           suspensionUntil = profileRow.suspension_until ?? null;
@@ -326,7 +324,9 @@ const AdminReports = () => {
       const warningsResponse = targetUserId
         ? await supabase
             .from("user_warnings")
-            .select("id, reason, severity, duration_hours, created_at, admin:admin_id (id, username)")
+            .select(`
+              id, reason, severity, duration_hours, created_at,
+              admin:admin_id (user_id, username)
+            `)
             .eq("user_id", targetUserId)
             .order("created_at", { ascending: false })
         : { data: [] as unknown[], error: null };
@@ -335,7 +335,10 @@ const AdminReports = () => {

       const historyResponse = await supabase
         .from("moderation_log")
-        .select("id, action, target_type, target_id, reason, details, created_at, admin:admin_id (id, username)")
+        .select(`
+          id, action, target_type, target_id, reason, details, created_at,
+          admin:admin_id (user_id, username)
+        `)
         .eq("target_id", report.target_id)
         .order("created_at", { ascending: false });

@@ -727,7 +730,7 @@ const AdminReports = () => {
                     <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{report.reason}</p>
                     <p className="mt-2 text-xs text-muted-foreground">
-                      Reported by {report.reporter?.username ?? report.reporter?.id ?? "Unknown"}
+                      Reported by {report.reporter?.username ?? report.reporter?.user_id ?? "Unknown"}
                     </p>

@@ -797,7 +800,7 @@ const AdminReports = () => {
                                       )}
                                       {warning.admin && (
                                         <div className="text-[11px] text-muted-foreground">
-                                          By {warning.admin.username ?? warning.admin.id ?? "admin"}
+                                          By {warning.admin.username ?? warning.admin.user_id ?? "admin"}
                                         </div>
                                       )}
                                     </div>
@@ -867,7 +870,7 @@ const AdminReports = () => {
                                   currentDetails.modHistory.map((entry) => (
                                     <div key={entry.id} className="border-l-2 border-gray-300 pl-3">
                                       <div className="font-medium">
-                                        {entry.admin?.username ?? entry.admin?.id ?? "Unknown admin"} – {entry.action}
+                                        {entry.admin?.username ?? entry.admin?.user_id ?? "Unknown admin"} – {entry.action}
                                       </div>
                                       <div className="text-gray-600">{entry.reason}</div>
                                       <div className="text-xs text-muted-foreground">
```

### src/lib/admin.ts
```diff
--- a/src/lib/admin.ts
+++ b/src/lib/admin.ts
@@ -24,7 +24,7 @@ export const isAdminUser = async (userId?: string | null): Promise<boolean> =>
   // Query database
   const { data, error } = await supabase
     .from('admin_users')
-    .select('user_id')
+    .select('user_id, granted_by, granted_at')
     .eq('user_id', userId)
     .maybeSingle();
```

## RPC Functions Required

The following RPC functions are called by AdminReports and need to exist:

### admin_delete_catch
```sql
CREATE OR REPLACE FUNCTION admin_delete_catch(
  catch_id UUID,
  reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE catches
  SET deleted_at = NOW()
  WHERE id = catch_id;

  INSERT INTO moderation_log (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'delete_catch', 'catch', catch_id, reason);
END;
$$;
```

### admin_delete_comment
```sql
CREATE OR REPLACE FUNCTION admin_delete_comment(
  comment_id UUID,
  reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE catch_comments
  SET deleted_at = NOW()
  WHERE id = comment_id;

  INSERT INTO moderation_log (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'delete_comment', 'comment', comment_id, reason);
END;
$$;
```

### admin_restore_catch
```sql
CREATE OR REPLACE FUNCTION admin_restore_catch(
  catch_id UUID,
  reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE catches
  SET deleted_at = NULL
  WHERE id = catch_id;

  INSERT INTO moderation_log (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'restore_catch', 'catch', catch_id, reason);
END;
$$;
```

### admin_restore_comment
```sql
CREATE OR REPLACE FUNCTION admin_restore_comment(
  comment_id UUID,
  reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE catch_comments
  SET deleted_at = NULL
  WHERE id = comment_id;

  INSERT INTO moderation_log (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'restore_comment', 'comment', comment_id, reason);
END;
$$;
```

### admin_warn_user
```sql
CREATE OR REPLACE FUNCTION admin_warn_user(
  user_id UUID,
  reason TEXT,
  severity warning_severity,
  duration_hours INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_warn_count INTEGER;
  new_moderation_status moderation_status;
  new_suspension_until TIMESTAMPTZ;
BEGIN
  -- Insert warning
  INSERT INTO user_warnings (user_id, admin_id, reason, severity, duration_hours)
  VALUES (user_id, auth.uid(), reason, severity, duration_hours);

  -- Update profile moderation status
  SELECT warn_count + 1 INTO new_warn_count
  FROM profiles WHERE user_id = user_id;

  IF severity = 'permanent_ban' THEN
    new_moderation_status := 'banned';
    new_suspension_until := NULL;
  ELSIF severity = 'temporary_suspension' THEN
    new_moderation_status := 'suspended';
    new_suspension_until := NOW() + (duration_hours || ' hours')::INTERVAL;
  ELSE
    new_moderation_status := 'warned';
    new_suspension_until := NULL;
  END IF;

  UPDATE profiles
  SET
    warn_count = new_warn_count,
    moderation_status = new_moderation_status,
    suspension_until = new_suspension_until
  WHERE user_id = user_id;
END;
$$;
```

## Breaking Changes

1. **Type System:**
   - `ReportStatus` is now a strict ENUM
   - `SeverityOption` is now a strict ENUM
   - Invalid values will cause runtime errors

2. **Field Renames:**
   - `profiles.id` → `profiles.user_id`
   - `reporter.id` → `reporter.user_id`
   - `admin.id` → `admin.user_id`

3. **New Required Tables:**
   - `user_warnings` must exist
   - `moderation_log` must exist

4. **Soft Delete:**
   - `catch_comments.deleted_at` must exist

## Testing Recommendations

1. **Reports Management**
   - ✓ Verify reports list loads correctly
   - ✓ Test filtering by target type
   - ✓ Test report status updates
   - ✓ Verify reporter info displays

2. **Moderation Actions**
   - ✓ Test deleting catches
   - ✓ Test deleting comments
   - ✓ Test restoring content
   - ✓ Test warning users
   - ✓ Verify moderation logs created

3. **User Warnings**
   - ✓ Test warning creation
   - ✓ Test temporary suspension
   - ✓ Test permanent ban
   - ✓ Verify warn_count increments
   - ✓ Test moderation_status updates

4. **Edge Cases**
   - ✓ Reports on deleted content
   - ✓ Reports on missing users
   - ✓ Multiple warnings on same user
   - ✓ Admin actions as non-admin (should fail)

## Notes

- All moderation actions create audit log entries
- Soft delete preserves data for recovery
- Moderation status affects user access (implement in RLS)
- Warning count escalation should be enforced
- Admin actions are security definer (bypass RLS)

## Validation Checklist
- [ ] Update type imports to use Database types
- [ ] Change profiles.id to profiles.user_id in queries
- [ ] Change admin.id to admin.user_id in displays
- [ ] Change reporter.id to reporter.user_id
- [ ] Add resolved_at, resolved_by to report queries
- [ ] Test report CRUD operations
- [ ] Deploy RPC functions for moderation
- [ ] Test soft delete/restore flows
- [ ] Test user warning creation
- [ ] Verify moderation logs created
- [ ] Test all admin UI interactions
