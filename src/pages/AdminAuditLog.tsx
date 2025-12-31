import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getProfilePath } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";

type SortDirection = "asc" | "desc";
type DateRange = "24h" | "7d" | "30d" | "all";

interface AdminProfileSummary {
  id: string | null;
  username: string | null;
}

interface LogRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  user_id?: string;
  reason: string;
  details: Record<string, unknown> | null;
  created_at: string;
  admin: AdminProfileSummary | null;
}

interface ModerationLogFetchRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  user_id: string | null;
  catch_id: string | null;
  comment_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_id: string | null;
  admin_username: string | null;
}

const formatRelative = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true });

const actionLabels: Record<string, string> = {
  delete_catch: "Deleted Catch",
  delete_comment: "Deleted Comment",
  warn_user: "Warned User",
  restore_catch: "Restored Catch",
  restore_comment: "Restored Comment",
  clear_moderation: "Restrictions lifted",
  suspend_user: "Suspended User",
};

const formatActionLabel = (action: string) => {
  if (actionLabels[action]) return actionLabels[action];
  const cleaned = action.replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const SENSITIVE_METADATA_KEYS = /(password|token|secret|authorization|cookie|session|jwt|email|ip|user_agent|phone|address)/i;
const MAX_METADATA_VALUE_LENGTH = 200;
const MAX_METADATA_PREVIEW_LENGTH = 160;

const sanitizeMetadataValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeMetadataValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
        if (SENSITIVE_METADATA_KEYS.test(key)) {
          return [key, "[redacted]"];
        }
        return [key, sanitizeMetadataValue(entryValue)];
      })
    );
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > MAX_METADATA_VALUE_LENGTH) {
      return `${trimmed.slice(0, MAX_METADATA_VALUE_LENGTH)}…`;
    }
    return trimmed;
  }
  return value;
};

const formatMetadata = (details: Record<string, unknown> | null) => {
  if (!details) return "—";
  const sanitized = sanitizeMetadataValue(details);
  return JSON.stringify(sanitized, null, 2);
};

const buildMetadataPreview = (text: string) =>
  text.length > MAX_METADATA_PREVIEW_LENGTH ? `${text.slice(0, MAX_METADATA_PREVIEW_LENGTH)}…` : text;

type ActionOption = { label: string; value: string };

const actionOptions: ActionOption[] = [
  { label: "All actions", value: "all" },
  ...Object.entries(actionLabels).map(([value, label]) => ({ label, value })),
];

const normalizeLogRows = (rows: ModerationLogFetchRow[]): LogRow[] =>
  rows.map((row) => {
    const metadata = row.metadata ?? null;
    const reason =
      metadata && typeof metadata["reason"] === "string" ? (metadata["reason"] as string) : "No reason provided";
    const targetType =
      row.target_type ?? (row.comment_id ? "comment" : row.catch_id ? "catch" : row.user_id ? "user" : "unknown");
    const targetId = row.target_id ?? row.comment_id ?? row.catch_id ?? row.user_id ?? "";

    return {
      id: row.id,
      action: row.action,
      target_type: targetType,
      target_id: targetId,
      user_id: row.user_id ?? undefined,
      reason,
      details: metadata,
      created_at: row.created_at,
      admin: row.admin_id || row.admin_username ? { id: row.admin_id, username: row.admin_username } : null,
    } satisfies LogRow;
  });

const AdminAuditLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  const [logRows, setLogRows] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ActionOption["value"]>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const actionFilterId = useId();
  const dateRangeId = useId();
  const searchId = useId();

  const getQueryParams = useCallback(() => {
    const range =
      dateRange === "24h" ? 1 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : null;
    const since = range ? new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString() : null;

    return {
      p_user_id: null,
      p_action: actionFilter === "all" ? null : actionFilter,
      p_search: searchTerm.trim() === "" ? null : searchTerm.trim(),
      p_from: since,
      p_to: null,
      p_sort_direction: sortDirection,
    } as const;
  }, [actionFilter, dateRange, searchTerm, sortDirection]);

  const fetchAuditLogPage = useCallback(
    async (limit: number, offset: number) => {
      const { data, error } = await supabase.rpc(
        "admin_list_moderation_log" as never,
        {
          ...getQueryParams(),
          p_limit: limit,
          p_offset: offset,
        } as never
      );

      if (error) {
        throw error;
      }

      return (data ?? []) as unknown as ModerationLogFetchRow[];
    },
    [getQueryParams]
  );

  const fetchAuditLog = useCallback(async () => {
    if (!user || !isAdmin) return;
    setIsLoading(true);

    try {
      const rows = await fetchAuditLogPage(pageSize, (page - 1) * pageSize);
      setLogRows(normalizeLogRows(rows));
    } catch {
      toast.error("Unable to load moderation log");
      setLogRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAuditLogPage, isAdmin, page, pageSize, user]);

  useEffect(() => {
    if (isAdmin) {
      void fetchAuditLog();
    }
  }, [fetchAuditLog, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("moderation-log-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "moderation_log",
        },
        () => {
          void fetchAuditLog();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchAuditLog, isAdmin]);

  const canGoNext = logRows.length === pageSize;

  const handleViewTarget = useCallback(
    async (row: LogRow) => {
      if (!row.target_id) {
        toast.error("Unable to open target");
        return;
      }

      if (row.target_type === "catch") {
        navigate(`/catch/${row.target_id}`);
        return;
      }

      if (row.target_type === "user") {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", row.target_id)
          .maybeSingle();

        navigate(getProfilePath({ username: profileRow?.username ?? null, id: row.target_id }));
        return;
      }

      if (row.target_type === "comment") {
        const { data, error } = await supabase
          .from("catch_comments")
          .select("catch_id")
          .eq("id", row.target_id)
          .maybeSingle();

        if (error || !data) {
          toast.error("Unable to open related comment");
          return;
        }

        navigate(`/catch/${data.catch_id}`);
      }
    },
    [navigate]
  );

  const resolveModerationUserId = (row: LogRow) =>
    row.user_id ?? (row.target_type === "user" && row.target_id ? row.target_id : null);

  const handleViewUserModeration = useCallback(
    (row: LogRow) => {
      const targetUserId = resolveModerationUserId(row);
      if (!targetUserId) return;
      navigate(`/admin/users/${targetUserId}/moderation`, { state: { from: "audit-log" } });
    },
    [navigate]
  );

  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Show loading spinner while checking admin status
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </PageContainer>
      </div>
    );
  }

  // Redirect handled by useAdminAuth hook
  if (!isAdmin) {
    return null;
  }

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const exportRows: LogRow[] = [];
      let offset = 0;
      let batch: ModerationLogFetchRow[] = [];

      do {
        batch = await fetchAuditLogPage(pageSize, offset);
        if (batch.length === 0) break;
        exportRows.push(...normalizeLogRows(batch));
        offset += pageSize;
      } while (batch.length === pageSize);

      if (exportRows.length === 0) {
        toast.error("No rows to export");
        return;
      }

      const header = ["Timestamp", "Admin", "Action", "Target Type", "Target Id", "Reason", "Details"];
      const escapeValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

      const csv = [
        header.map(escapeValue).join(","),
        ...exportRows.map((row) => {
          const timestamp = format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ssXXX");
          const adminName = row.admin?.username ?? row.admin?.id ?? "Unknown";
          const actionLabel = formatActionLabel(row.action);
          const reason = row.reason;
          const details = formatMetadata(row.details);

          return [timestamp, adminName, actionLabel, row.target_type, row.target_id, reason, details]
            .map(escapeValue)
            .join(",");
        }),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moderation-log-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Moderation log exported");
    } catch (error) {
      console.error(error);
      toast.error("Unable to export moderation log");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-6xl py-8 md:py-10 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={<Eyebrow className="text-muted-foreground">Admin</Eyebrow>}
              title="Audit log"
              subtitle="History of moderation actions."
              titleAs="h1"
              actions={
                <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <Button onClick={() => void fetchAuditLog()} disabled={isLoading} variant="ghost" className="w-full sm:w-auto">
                    Refresh
                  </Button>
                </div>
              }
            />
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="sm" className="text-foreground">
                  Filters
                </Heading>
                <Text variant="muted" className="text-sm">
                  Refine by action, date, or keyword.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 items-end">
                  <div className="space-y-2 min-w-0">
                    <label htmlFor={actionFilterId} className="block text-sm font-medium text-muted-foreground">
                      Action
                    </label>
                    <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value as typeof actionFilter); setPage(1); }}>
                      <SelectTrigger id={actionFilterId} className="w-full">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label htmlFor={dateRangeId} className="block text-sm font-medium text-muted-foreground">
                      Date range
                    </label>
                    <Select value={dateRange} onValueChange={(value) => { setDateRange(value as DateRange); setPage(1); }}>
                      <SelectTrigger id={dateRangeId} className="w-full">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0 sm:col-span-2 xl:col-span-2">
                    <label htmlFor={searchId} className="block text-sm font-medium text-muted-foreground">
                      Search
                    </label>
                    <Input
                      id={searchId}
                      placeholder="Search by admin, reason, target, or details"
                      value={searchTerm}
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button variant="outline" onClick={handleToggleSort} className="w-full sm:w-auto">
                    Sort: {sortDirection === "asc" ? "Oldest first" : "Newest first"}
                  </Button>
                  <Button
                    onClick={() => void handleExportCsv()}
                    disabled={isExporting || logRows.length === 0}
                    className="w-full sm:w-auto"
                  >
                    Export CSV
                  </Button>
                </div>
                <Text variant="muted" className="text-xs">
                  Export includes all matching rows; the table view shows 100 per page.
                </Text>
              </CardContent>
            </Card>

            {(dateRange !== "7d" || actionFilter !== "all" || searchTerm.trim()) && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-3">
                <span className="rounded-full bg-muted px-3 py-1">
                  {dateRange === "24h"
                    ? "Last 24 hours"
                    : dateRange === "7d"
                    ? "Last 7 days"
                    : dateRange === "30d"
                    ? "Last 30 days"
                    : "All time"}
                </span>
                {actionFilter !== "all" && (
                  <span className="rounded-full bg-muted px-3 py-1">
                    {actionFilter === "all" ? "All actions" : formatActionLabel(actionFilter)}
                  </span>
                )}
                {searchTerm.trim() ? (
                  <span className="rounded-full bg-muted px-3 py-1 truncate">{`"${searchTerm.trim()}"`}</span>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDateRange("7d");
                    setActionFilter("all");
                    setSearchTerm("");
                    setPage(1);
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="sm" className="text-foreground">
                  Activity
                </Heading>
                <Text variant="muted" className="text-sm">
                  Recent moderation actions with links to targets.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <Text variant="muted" className="text-sm">
                    Loading moderation log…
                  </Text>
                ) : logRows.length === 0 ? (
                  <Text variant="muted" className="text-sm">
                    No moderation actions matched your filters.
                  </Text>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Relative</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead className="text-right">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logRows.map((row) => {
                          const adminName = row.admin?.username ?? row.admin?.id ?? "Unknown";
                          const displayAction = formatActionLabel(row.action);
                          const detailsText = formatMetadata(row.details);
                          const detailsPreview = detailsText === "—" ? detailsText : buildMetadataPreview(detailsText);
                          const targetLabel =
                            row.target_type === "user"
                              ? row.target_id
                                ? `@${row.target_id}`
                                : "User"
                              : row.target_type === "catch"
                              ? "Catch"
                              : row.target_type === "comment"
                              ? "Comment"
                              : "Unknown";

                          return (
                            <TableRow key={row.id} className="align-top">
                              <TableCell className="whitespace-nowrap text-sm">
                                {format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                {formatRelative(row.created_at)}
                              </TableCell>
                              <TableCell className="max-w-[12rem] whitespace-nowrap text-sm text-foreground truncate">
                                {adminName}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground max-w-[12rem] truncate">
                                  {displayAction}
                                </span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                <div className="flex flex-col">
                                  <span className="text-sm text-foreground">{targetLabel}</span>
                                  {row.target_id ? <span className="font-mono text-[11px] text-muted-foreground truncate">{row.target_id}</span> : null}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[12rem] max-w-[18rem] text-sm text-foreground">
                                <span className="line-clamp-2">{row.reason}</span>
                              </TableCell>
                              <TableCell className="max-w-[18rem] text-xs text-muted-foreground">
                                {detailsText === "—" ? (
                                  <span>{detailsText}</span>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="line-clamp-2 whitespace-pre-wrap break-words">{detailsPreview}</p>
                                    <details className="text-xs text-muted-foreground">
                                      <summary className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline">
                                        View full metadata
                                      </summary>
                                      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                                        {detailsText}
                                      </pre>
                                    </details>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => void handleViewTarget(row)}
                                    disabled={!row.target_id}
                                  >
                                    View
                                  </Button>
                                  {resolveModerationUserId(row) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full sm:w-auto"
                                      onClick={() => handleViewUserModeration(row)}
                                    >
                                      Moderation
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    {`Showing ${logRows.length} action${logRows.length === 1 ? "" : "s"} (${dateRange === "24h" ? "Last 24 hours" : dateRange === "7d" ? "Last 7 days" : dateRange === "30d" ? "Last 30 days" : "All time"}, ${actionFilter === "all" ? "All actions" : actionLabels[actionFilter] ?? actionFilter})`}
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1 || isLoading}
                      className="w-full sm:w-auto"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={!canGoNext || isLoading}
                      className="w-full sm:w-auto"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default AdminAuditLog;
