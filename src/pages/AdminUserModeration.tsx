import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type WarningRow = {
  id: string;
  reason: string;
  severity: string;
  duration_hours: number | null;
  created_at: string;
  admin: { id: string | null; username: string | null } | null;
};

type ModerationLogRow = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin: { id: string | null; username: string | null } | null;
};

const formatRelative = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true });

const AdminUserModeration = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  const [profileStatus, setProfileStatus] = useState<{
    username: string | null;
    warn_count: number;
    moderation_status: string;
    suspension_until: string | null;
  } | null>(null);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [logRows, setLogRows] = useState<ModerationLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin || !userId) return;
      setIsLoading(true);

      const [profileResp, warningsResp, logResp] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, warn_count, moderation_status, suspension_until")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("user_warnings")
          .select("id, reason, severity, duration_hours, created_at, admin:issued_by (id, username)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("moderation_log")
          .select("id, action, target_type, target_id, metadata, created_at, admin:admin_id (id, username)")
          .or(`user_id.eq.${userId},target_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (profileResp.error) {
        toast.error("Unable to load user moderation status");
      }
      if (warningsResp.error) {
        toast.error("Unable to load warnings");
      }
      if (logResp.error) {
        toast.error("Unable to load moderation history");
      }

      if (profileResp.data) {
        setProfileStatus({
          username: profileResp.data.username,
          warn_count: profileResp.data.warn_count ?? 0,
          moderation_status: profileResp.data.moderation_status ?? "active",
          suspension_until: profileResp.data.suspension_until ?? null,
        });
      } else {
        setProfileStatus(null);
      }

      setWarnings((warningsResp.data as WarningRow[]) ?? []);

      const mappedLog = ((logResp.data as ModerationLogRow[]) ?? []).map((row) => {
        const metadata = row.metadata ?? {};
        const reason = typeof metadata["reason"] === "string" ? (metadata["reason"] as string) : "No reason provided";
        return { ...row, reason } satisfies ModerationLogRow;
      });
      setLogRows(mappedLog);

      setIsLoading(false);
    };

    void fetchData();
  }, [isAdmin, user, userId]);

  const warningsTable = useMemo(() => {
    if (warnings.length === 0) {
      return <p className="text-sm text-muted-foreground">No warnings for this user.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issued</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warnings.map((warning) => (
              <TableRow key={warning.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatRelative(warning.created_at)}
                </TableCell>
                <TableCell className="text-sm font-medium capitalize">{warning.severity.replace("_", " ")}</TableCell>
                <TableCell className="text-sm text-foreground">{warning.reason}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {warning.duration_hours ? `${warning.duration_hours}h` : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {warning.admin?.username ?? warning.admin?.id ?? "Unknown"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [warnings]);

  const logTable = useMemo(() => {
    if (logRows.length === 0) {
      return <p className="text-sm text-muted-foreground">No moderation history.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatRelative(row.created_at)}
                </TableCell>
                <TableCell className="text-sm font-medium">{row.action}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.target_type ?? "unknown"}: <span className="font-mono">{row.target_id ?? "—"}</span>
                </TableCell>
                <TableCell className="text-sm text-foreground">{row.reason}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.admin?.username ?? row.admin?.id ?? "Unknown"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [logRows]);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User moderation</h1>
            <p className="text-sm text-muted-foreground">
              Read-only overview of warnings and moderation history for this user.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : profileStatus ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{profileStatus.username ?? userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Moderation status</span>
                  <span className="font-semibold capitalize">{profileStatus.moderation_status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Warnings</span>
                  <span className="font-semibold">{profileStatus.warn_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Suspension until</span>
                  <span className="font-semibold">
                    {profileStatus.suspension_until ? new Date(profileStatus.suspension_until).toLocaleString() : "—"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-destructive">User not found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
          </CardHeader>
          <CardContent>{isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : warningsTable}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation history</CardTitle>
          </CardHeader>
          <CardContent>{isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : logTable}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserModeration;
