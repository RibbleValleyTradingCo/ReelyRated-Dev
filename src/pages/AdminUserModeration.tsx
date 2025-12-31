import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveAvatarUrl } from "@/lib/storage";
import { getProfilePath } from "@/lib/profile";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";

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

const WARNINGS_PAGE_SIZE = 20;
const LOG_PAGE_SIZE = 20;

const formatRelative = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true });
const truncate = (value: string, max = 120) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const AdminUserModeration = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  const [profileStatus, setProfileStatus] = useState<{
    username: string | null;
    warn_count: number;
    moderation_status: string;
    suspension_until: string | null;
    avatar_path: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [logRows, setLogRows] = useState<ModerationLogRow[]>([]);
  const [warningsPage, setWarningsPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [warningsHasMore, setWarningsHasMore] = useState(true);
  const [logHasMore, setLogHasMore] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showLiftDialog, setShowLiftDialog] = useState(false);
  const [warnReason, setWarnReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("24");
  const [banReason, setBanReason] = useState("");
  const [liftReason, setLiftReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const isLoading = profileLoading || warningsLoading || logLoading;

  const fetchProfile = useCallback(async () => {
    if (!user || !isAdmin || !userId) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);

    const profileResp = await supabase
      .from("profiles")
      .select("username, warn_count, moderation_status, suspension_until, avatar_path, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileResp.error) {
      toast.error("Unable to load user moderation status");
      setProfileStatus(null);
    } else if (profileResp.data) {
      setProfileStatus({
        username: profileResp.data.username,
        warn_count: profileResp.data.warn_count ?? 0,
        moderation_status: profileResp.data.moderation_status ?? "active",
        suspension_until: profileResp.data.suspension_until ?? null,
        avatar_path: profileResp.data.avatar_path ?? null,
        avatar_url: profileResp.data.avatar_url ?? null,
      });
    } else {
      setProfileStatus(null);
    }

    setProfileLoading(false);
  }, [isAdmin, user, userId]);

  const fetchWarnings = useCallback(
    async (pageToFetch: number) => {
      if (!user || !isAdmin || !userId) {
        setWarningsLoading(false);
        return;
      }
      setWarningsLoading(true);

      const warningsResp = await supabase
        .from("user_warnings")
        .select("id, reason, severity, duration_hours, created_at, admin:issued_by (id, username)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range((pageToFetch - 1) * WARNINGS_PAGE_SIZE, pageToFetch * WARNINGS_PAGE_SIZE - 1);

      if (warningsResp.error) {
        toast.error("Unable to load warnings");
        setWarningsLoading(false);
        return;
      }

      const warningRows = ((warningsResp.data ?? []) as unknown as WarningRow[]) ?? [];
      setWarnings((prev) => (pageToFetch === 1 ? warningRows : [...prev, ...warningRows]));
      setWarningsHasMore(warningRows.length === WARNINGS_PAGE_SIZE);
      setWarningsLoading(false);
    },
    [isAdmin, user, userId]
  );

  const fetchLog = useCallback(
    async (pageToFetch: number) => {
      if (!user || !isAdmin || !userId) {
        setLogLoading(false);
        return;
      }
      setLogLoading(true);

      const logResp = await supabase.rpc("admin_list_moderation_log", {
        p_user_id: userId,
        p_action: null,
        p_search: null,
        p_from: null,
        p_to: null,
        p_sort_direction: "desc",
        p_limit: LOG_PAGE_SIZE,
        p_offset: (pageToFetch - 1) * LOG_PAGE_SIZE,
      });

      if (logResp.error) {
        toast.error("Unable to load moderation history");
        setLogLoading(false);
        return;
      }

      const mappedLog = ((logResp.data ?? []) as unknown as ModerationLogRow[]).map((row) => {
        const metadata = row.metadata ?? {};
        const reason = typeof metadata["reason"] === "string" ? (metadata["reason"] as string) : "No reason provided";
        return { ...row, reason } satisfies ModerationLogRow;
      });

      setLogRows((prev) => (pageToFetch === 1 ? mappedLog : [...prev, ...mappedLog]));
      setLogHasMore(mappedLog.length === LOG_PAGE_SIZE);
      setLogLoading(false);
    },
    [isAdmin, user, userId]
  );

  const handleRefresh = useCallback(() => {
    setProfileLoading(true);
    setWarningsLoading(true);
    setLogLoading(true);
    setWarnings([]);
    setLogRows([]);
    setWarningsHasMore(true);
    setLogHasMore(true);
    setWarningsPage(1);
    setLogPage(1);
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setProfileStatus(null);
    setProfileLoading(true);
    setWarningsLoading(true);
    setLogLoading(true);
    setWarnings([]);
    setLogRows([]);
    setWarningsHasMore(true);
    setLogHasMore(true);
    setWarningsPage(1);
    setLogPage(1);
  }, [userId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile, refreshKey]);

  useEffect(() => {
    void fetchWarnings(warningsPage);
  }, [fetchWarnings, refreshKey, warningsPage]);

  useEffect(() => {
    void fetchLog(logPage);
  }, [fetchLog, logPage, refreshKey]);

  const warningsTable = useMemo(() => {
    if (warnings.length === 0) {
      return <p className="text-sm text-muted-foreground">No warnings issued yet.</p>;
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
                <TableCell className="text-sm text-foreground">
                  <span title={warning.reason} className="block max-w-[24rem] truncate">
                    {truncate(warning.reason, 120)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {warning.duration_hours ? `${warning.duration_hours}h` : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {warning.admin?.id ? (
                    <Link
                      to={`/admin/users/${warning.admin.id}/moderation`}
                      className="text-primary hover:underline"
                    >
                      {warning.admin.username ?? warning.admin.id}
                    </Link>
                  ) : (
                    warning.admin?.username ?? warning.admin?.id ?? "Unknown"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {warningsHasMore && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWarningsPage((prev) => prev + 1)}
              className="w-full sm:w-auto"
            >
              Load more warnings
            </Button>
          </div>
        )}
      </div>
    );
  }, [warnings, warningsHasMore]);

  const logTable = useMemo(() => {
    if (logRows.length === 0) {
      return <p className="text-sm text-muted-foreground">No moderation actions recorded yet.</p>;
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
            {logRows.map((row) => {
              const targetLabel =
                row.target_type === "user"
                  ? `@${row.target_id ?? "user"}`
                  : row.target_type === "catch"
                  ? "Catch"
                  : row.target_type === "comment"
                  ? "Comment"
                  : "Unknown";

              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatRelative(row.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                      {row.action}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{targetLabel}</span>
                      {row.target_id ? (
                        <span className="font-mono text-[11px] text-muted-foreground">{row.target_id}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    <span title={row.reason} className="block max-w-[24rem] truncate">
                      {truncate(row.reason, 120)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.admin?.id ? (
                      <Link
                        to={`/admin/users/${row.admin.id}/moderation`}
                        className="text-primary hover:underline"
                      >
                        {row.admin.username ?? row.admin.id}
                      </Link>
                    ) : (
                      row.admin?.username ?? row.admin?.id ?? "Unknown"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {logHasMore && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogPage((prev) => prev + 1)}
              className="w-full sm:w-auto"
            >
              Load more history
            </Button>
          </div>
        )}
      </div>
    );
  }, [logRows, logHasMore]);

  const applyModerationAction = useCallback(
    async (params: {
      severity: "warning" | "temporary_suspension" | "permanent_ban";
      reason: string;
      durationHours?: number;
    }) => {
      if (!userId) {
        toast.error("User not found");
        return;
      }
      const trimmed = params.reason.trim();
      if (!trimmed) {
        toast.error("Please provide a reason");
        return;
      }
      if (params.severity === "temporary_suspension") {
        if (!params.durationHours || Number.isNaN(params.durationHours) || params.durationHours <= 0) {
          toast.error("Enter a valid suspension duration in hours");
          return;
        }
      }

      setActionLoading(true);
      try {
        const payload: {
          p_user_id: string;
          p_reason: string;
          p_severity?: "warning" | "temporary_suspension" | "permanent_ban";
          p_duration_hours?: number;
        } = {
          p_user_id: userId,
          p_reason: trimmed,
          p_severity: params.severity,
        };
        if (params.severity === "temporary_suspension" && params.durationHours) {
          payload.p_duration_hours = params.durationHours;
        }

        const { error } = await supabase.rpc("admin_warn_user" as never, payload as never);
        if (error) throw error;

        const successMessage =
          params.severity === "warning"
            ? "Warning recorded"
            : params.severity === "temporary_suspension"
            ? "Temporary suspension applied"
            : "User banned";
        toast.success(successMessage);
        setShowWarnDialog(false);
        setShowSuspendDialog(false);
        setShowBanDialog(false);
        setWarnReason("");
        setSuspendReason("");
        setSuspendDuration("24");
        setBanReason("");
        handleRefresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to apply moderation action");
      } finally {
        setActionLoading(false);
      }
    },
    [handleRefresh, userId]
  );

  const handleLiftRestrictions = useCallback(async () => {
    if (!userId) {
      toast.error("User not found");
      return;
    }
    const trimmed = liftReason.trim();
    if (!trimmed) {
      toast.error("Please provide a reason");
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc(
        "admin_clear_moderation_status" as never,
        {
          p_user_id: userId,
          p_reason: trimmed,
        } as never
      );
      if (error) throw error;
      toast.success("Restrictions lifted");
      setShowLiftDialog(false);
      setLiftReason("");
      handleRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to lift restrictions");
    } finally {
      setActionLoading(false);
    }
  }, [handleRefresh, liftReason, userId]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </PageContainer>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const backDestination = (() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from === "reports") return "/admin/reports";
    if (from === "audit-log") return "/admin/audit-log";
    if (profileStatus?.username || userId) {
      return `/profile/${profileStatus?.username ?? userId}`;
    }
    return "/feed";
  })();

  const displayName = profileStatus?.username ? `@${profileStatus.username}` : userId ?? "user";
  const avatarUrl = resolveAvatarUrl({
    path: profileStatus?.avatar_path ?? null,
    legacyUrl: profileStatus?.avatar_url ?? null,
  });
  const currentStatus = profileStatus?.moderation_status ?? "active";
  const isSuspended = currentStatus === "suspended";
  const isBanned = currentStatus === "banned";
  const canApplyStandardActions = currentStatus === "active" || currentStatus === "warned";

  const moderationStatusLabel = (() => {
    if (currentStatus === "suspended" && profileStatus?.suspension_until) {
      return `Suspended until ${new Date(profileStatus.suspension_until).toLocaleString()}`;
    }
    if (currentStatus === "banned") return "Banned";
    if (currentStatus === "warned") return "Warned";
    return "Active";
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-5xl py-8 md:py-10 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={<Eyebrow className="text-muted-foreground">Admin</Eyebrow>}
              title={`Moderation for ${displayName}`}
              subtitle="Moderation overview and actions for this user."
              titleAs="h1"
              actions={
                <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button variant="outline" onClick={() => navigate(backDestination)} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <Button variant="ghost" onClick={handleRefresh} disabled={isLoading} className="w-full sm:w-auto">
                    Refresh
                  </Button>
                </div>
              }
            />
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={avatarUrl ?? ""} alt={displayName} />
                      <AvatarFallback>{profileStatus?.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                        <span className="truncate">{profileStatus?.username ?? "Unknown user"}</span>
                        <span className="text-xs font-normal text-muted-foreground truncate">
                          ({userId ?? "user"})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            (profileStatus?.moderation_status ?? "active") === "active"
                              ? "bg-muted text-foreground"
                              : (profileStatus?.moderation_status ?? "active") === "warned"
                              ? "bg-secondary/20 text-secondary"
                              : (profileStatus?.moderation_status ?? "active") === "suspended"
                              ? "bg-secondary/30 text-secondary"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {moderationStatusLabel}
                        </span>
                        <span className="whitespace-nowrap">Warnings: {profileStatus?.warn_count ?? 0}/3</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto">
                    <div className="flex flex-wrap gap-2">
                      {profileStatus?.username || userId ? (
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <Link to={getProfilePath({ username: profileStatus?.username ?? null, id: userId ?? undefined })}>
                            View profile
                          </Link>
                        </Button>
                      ) : null}
                      {userId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() =>
                            navigate(`/admin/reports?reportedUserId=${userId}`, {
                              state: { filterUserId: userId, filterUsername: profileStatus?.username ?? null },
                            })
                          }
                        >
                          View reports about this user
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Moderation actions</span>
                      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                        {canApplyStandardActions ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setShowWarnDialog(true)}
                              disabled={actionLoading || isLoading || !userId}
                              className="w-full sm:w-auto"
                            >
                              Warn user
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowSuspendDialog(true)}
                              disabled={actionLoading || isLoading || !userId}
                              className="w-full sm:w-auto"
                            >
                              Temporary suspension
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setShowBanDialog(true)}
                              disabled={actionLoading || isLoading || !userId}
                              className="w-full sm:w-auto"
                            >
                              Ban user
                            </Button>
                          </>
                        ) : null}
                        {isSuspended ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setShowBanDialog(true)}
                              disabled={actionLoading || isLoading || !userId}
                              className="w-full sm:w-auto"
                            >
                              Escalate to ban
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowLiftDialog(true)}
                              disabled={actionLoading || isLoading || !userId}
                              className="w-full sm:w-auto"
                            >
                              Lift restrictions
                            </Button>
                          </>
                        ) : null}
                        {isBanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowLiftDialog(true)}
                            disabled={actionLoading || isLoading || !userId}
                            className="w-full sm:w-auto"
                          >
                            Lift restrictions
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="sm" className="text-foreground">
                  Current status
                </Heading>
                <Text variant="muted" className="text-sm">
                  Live moderation state for this account.
                </Text>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isLoading ? (
                  <Text variant="muted">Loading…</Text>
                ) : profileStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Text variant="muted">User</Text>
                      <Text className="font-medium text-right truncate">{profileStatus.username ?? userId}</Text>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Text variant="muted">Moderation status</Text>
                      <Text className="font-semibold capitalize text-right truncate">{profileStatus.moderation_status}</Text>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Text variant="muted">Warnings</Text>
                      <Text className="font-semibold text-right">{profileStatus.warn_count}</Text>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Text variant="muted">Suspension until</Text>
                      <Text className="font-semibold text-right truncate">
                        {profileStatus.suspension_until ? new Date(profileStatus.suspension_until).toLocaleString() : "—"}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <Text className="text-destructive">User not found.</Text>
                )}
              </CardContent>
            </Card>
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="sm" className="text-foreground">
                  Warnings
                </Heading>
                <Text variant="muted" className="text-sm">
                  Recorded warnings for this user.
                </Text>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Text variant="muted" className="text-sm">
                    Loading…
                  </Text>
                ) : (
                  warningsTable
                )}
              </CardContent>
            </Card>
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="sm" className="text-foreground">
                  Moderation history
                </Heading>
                <Text variant="muted" className="text-sm">
                  Logged actions taken on this account.
                </Text>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Text variant="muted" className="text-sm">
                    Loading…
                  </Text>
                ) : (
                  logTable
                )}
              </CardContent>
            </Card>
          </Section>
        </div>
      </PageContainer>

      <Dialog open={showWarnDialog} onOpenChange={(open) => !actionLoading && setShowWarnDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn user</DialogTitle>
            <DialogDescription>Send a warning to this user with a brief reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="warn-reason">Reason</Label>
            <Textarea
              id="warn-reason"
              value={warnReason}
              onChange={(event) => setWarnReason(event.target.value)}
              rows={3}
              placeholder="Explain why this warning is being issued"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarnDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => void applyModerationAction({ severity: "warning", reason: warnReason })}
              disabled={actionLoading}
            >
              Send warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuspendDialog} onOpenChange={(open) => !actionLoading && setShowSuspendDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary suspension</DialogTitle>
            <DialogDescription>Temporarily suspend this user for a set number of hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason</Label>
              <Textarea
                id="suspend-reason"
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                rows={3}
                placeholder="Explain why this suspension is being applied"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suspend-duration">Duration (hours)</Label>
              <Input
                id="suspend-duration"
                type="number"
                min={1}
                value={suspendDuration}
                onChange={(event) => setSuspendDuration(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                void applyModerationAction({
                  severity: "temporary_suspension",
                  reason: suspendReason,
                  durationHours: parseInt(suspendDuration, 10),
                })
              }
              disabled={actionLoading}
            >
              Apply suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBanDialog} onOpenChange={(open) => !actionLoading && setShowBanDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban user</DialogTitle>
            <DialogDescription>Permanently ban this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="ban-reason">Reason</Label>
            <Textarea
              id="ban-reason"
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
              rows={3}
              placeholder="Explain why this ban is being applied"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void applyModerationAction({ severity: "permanent_ban", reason: banReason })}
              disabled={actionLoading}
            >
              Ban user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLiftDialog} onOpenChange={(open) => !actionLoading && setShowLiftDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lift restrictions</DialogTitle>
            <DialogDescription>Clear the current suspension or ban and return the user to active status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="lift-reason">Reason</Label>
            <Textarea
              id="lift-reason"
              value={liftReason}
              onChange={(event) => setLiftReason(event.target.value)}
              rows={3}
              placeholder="Add a short note for the moderation log"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLiftDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleLiftRestrictions()} disabled={actionLoading}>
              Confirm lift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserModeration;
