import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { useAuth } from "@/components/AuthProvider";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getProfilePath } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronDown, Filter } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";

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

interface ModerationLogEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: Record<string, unknown> | null;
  created_at: string;
  admin: { id: string | null; username: string | null } | null;
}

interface UserWarningEntry {
  id: string;
  reason: string;
  severity: SeverityOption;
  duration_hours: number | null;
  created_at: string;
  admin: { id: string | null; username: string | null } | null;
}

interface ReportDetails {
  targetUserId: string | null;
  parentCatchId: string | null;
  deletedAt: string | null;
  warnCount: number;
  moderationStatus: string;
  suspensionUntil: string | null;
  userWarnings: UserWarningEntry[];
  modHistory: ModerationLogEntry[];
  targetProfile: { id: string; username: string | null } | null;
  targetMissing: boolean;
}

interface WarningQueryRow {
  id: string;
  reason: string;
  severity: string;
  duration_hours: number | null;
  created_at: string;
  details: string | null;
  admin: { id: string | null; username: string | null } | null;
}

interface ModerationLogQueryRow {
  id: string;
  action: string;
  user_id: string | null;
  catch_id: string | null;
  comment_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin: { id: string | null; username: string | null } | null;
}

const severityOptions: { value: SeverityOption; label: string }[] = [
  { value: "warning", label: "Warning" },
  { value: "temporary_suspension", label: "Temporary suspension" },
  { value: "permanent_ban", label: "Permanent ban" },
];

const statusBadgeVariants: Record<ReportStatus, string> = {
  open: "bg-destructive/15 text-destructive",
  resolved: "bg-primary/15 text-primary",
  dismissed: "bg-muted/50 text-muted-foreground",
};

const formatRelative = (value: string | null | undefined) => {
  if (!value) return "N/A";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
};

const AdminReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "catch" | "comment" | "profile">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved" | "dismissed">("open");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [pageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"24h" | "7d" | "30d" | "all">("7d");

  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [details, setDetails] = useState<ReportDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [filteredUsername, setFilteredUsername] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [warnReason, setWarnReason] = useState("");
  const [warnSeverity, setWarnSeverity] = useState<SeverityOption>("warning");
  const [warnDuration, setWarnDuration] = useState("24");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  interface RpcReportRow {
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    status: ReportStatus;
    created_at: string;
    reporter_id: string | null;
    reporter_username: string | null;
    reporter_avatar_path: string | null;
    reporter_avatar_url: string | null;
  }

  const fetchReports = useCallback(
    async (options: { silently?: boolean } = {}) => {
      if (!user || !isAdmin) return;
      if (!options.silently) {
        setIsLoading(true);
      }

      const dateDays =
        dateRange === "24h" ? 1 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : null;
      const since = dateDays ? new Date(Date.now() - dateDays * 24 * 60 * 60 * 1000).toISOString() : null;

      const { data, error } = await supabase.rpc(
        "admin_list_reports" as never,
        {
          p_status: statusFilter === "all" ? null : statusFilter,
          p_type: filter === "all" ? null : filter,
          p_reported_user_id: filteredUserId ?? null,
          p_from: since,
          p_to: null,
          p_sort_direction: sortOrder === "oldest" ? "asc" : "desc",
          p_limit: pageSize,
          p_offset: (page - 1) * pageSize,
        } as never
      );

      if (error) {
        toast.error("Unable to load reports");
      } else if (data) {
        const normalized = ((data ?? []) as unknown as RpcReportRow[]).map((row) => ({
          id: row.id,
          target_type: row.target_type,
          target_id: row.target_id,
          reason: row.reason,
          status: row.status,
          created_at: row.created_at,
          reporter: row.reporter_id
            ? {
                id: row.reporter_id,
                username: row.reporter_username,
                avatar_path: row.reporter_avatar_path,
                avatar_url: row.reporter_avatar_url,
              }
            : null,
        })) as ReportRow[];
        setReports(normalized);
      }

      setIsLoading(false);
    },
    [user, isAdmin, sortOrder, pageSize, page, statusFilter, filter, filteredUserId, dateRange]
  );

  useEffect(() => {
    const state = (location.state as { filterUserId?: string; filterUsername?: string } | null) ?? null;
    const stateUserId = state?.filterUserId ?? null;
    const stateUsername = state?.filterUsername ?? null;
    const queryUserId = new URLSearchParams(location.search).get("reportedUserId") ?? new URLSearchParams(location.search).get("userId");
    const nextFilter = stateUserId ?? queryUserId ?? null;
    setFilteredUserId(nextFilter);
    setFilteredUsername(stateUsername ?? null);
    setPage(1);
  }, [location]);

  useEffect(() => {
    if (isAdmin) {
      void fetchReports();
    }
  }, [fetchReports, isAdmin]);

  useEffect(() => {
    const resolveUsername = async () => {
      if (!isAdmin || !filteredUserId) {
        setFilteredUsername(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", filteredUserId)
        .maybeSingle();
      if (error || !data) {
        setFilteredUsername(null);
        return;
      }
      setFilteredUsername(data.username ?? null);
    };
    void resolveUsername();
  }, [filteredUserId, isAdmin, user]);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-reports-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reports",
        },
        () => {
          void fetchReports({ silently: true });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "reports",
        },
        () => {
          void fetchReports({ silently: true });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reports",
        },
        () => {
          void fetchReports({ silently: true });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchReports, isAdmin, user]);

  useEffect(() => {
    if (!selectedReport) return;

    const updated = reports.find((report) => report.id === selectedReport.id);
    if (!updated) {
      setSelectedReport(null);
      setDetails(null);
      return;
    }

    if (
      updated.status !== selectedReport.status ||
      updated.reason !== selectedReport.reason ||
      updated.target_type !== selectedReport.target_type ||
      updated.target_id !== selectedReport.target_id
    ) {
      setSelectedReport(updated);
    }
  }, [reports, selectedReport]);

  const fetchReportDetails = useCallback(
    async (report: ReportRow): Promise<ReportDetails> => {
      if (!user || !isAdmin) {
        throw new Error("Admin privileges required");
      }

      let targetUserId: string | null = null;
      let parentCatchId: string | null = null;
      let deletedAt: string | null = null;
      let targetMissing = false;
      let targetProfile: { id: string; username: string | null } | null = null;
      let warnCount = 0;
      let moderationStatus = "active";
      let suspensionUntil: string | null = null;

      if (report.target_type === "catch") {
        const { data, error } = await supabase
          .from("catches")
          .select("id, user_id, deleted_at")
          .eq("id", report.target_id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          parentCatchId = data.id;
          targetUserId = data.user_id ?? null;
          deletedAt = data.deleted_at ?? null;
        } else {
          targetMissing = true;
          parentCatchId = report.target_id;
        }
      } else if (report.target_type === "comment") {
        const { data, error } = await supabase
          .from("catch_comments")
          .select("id, catch_id, user_id, deleted_at")
          .eq("id", report.target_id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          parentCatchId = data.catch_id;
          targetUserId = data.user_id ?? null;
          deletedAt = data.deleted_at ?? null;
        } else {
          targetMissing = true;
          parentCatchId = null;
        }
      } else {
        targetUserId = report.target_id;
        parentCatchId = null;
      }

      if (targetUserId) {
        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, warn_count, moderation_status, suspension_until")
          .eq("id", targetUserId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileRow) {
          targetProfile = { id: profileRow.id, username: profileRow.username };
          warnCount = profileRow.warn_count ?? 0;
          moderationStatus = profileRow.moderation_status ?? "active";
          suspensionUntil = profileRow.suspension_until ?? null;
        } else {
          targetMissing = true;
        }
      }

      const warningsResponse = targetUserId
        ? await supabase
            .from("user_warnings")
            .select(
              "id, reason, details, severity, duration_hours, created_at, admin:issued_by (id, username)",
            )
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false })
        : { data: [] as unknown[], error: null };

      if (warningsResponse.error) throw warningsResponse.error;

      let historyQuery = supabase
        .from("moderation_log")
        .select("id, action, user_id, catch_id, comment_id, metadata, created_at, admin:admin_id (id, username)")
        .order("created_at", { ascending: false });

      if (report.target_type === "catch") {
        historyQuery = historyQuery.eq("catch_id", report.target_id);
      } else if (report.target_type === "comment") {
        historyQuery = historyQuery.eq("comment_id", report.target_id);
      } else if (targetUserId) {
        historyQuery = historyQuery.eq("user_id", targetUserId);
      }

      const historyResponse = await historyQuery;

      if (historyResponse.error) throw historyResponse.error;

      const warningRows = (warningsResponse.data ?? []) as WarningQueryRow[];
      const historyRows = (historyResponse.data ?? []) as unknown as ModerationLogQueryRow[];

      const userWarnings = warningRows.map((entry) => {
        const severityValue = entry.severity as SeverityOption;
        const normalizedSeverity = severityOptions.some((option) => option.value === severityValue)
          ? severityValue
          : "warning";
        const displayedReason = entry.reason || entry.details || "Moderator action";

        return {
          id: entry.id,
          reason: displayedReason,
          severity: normalizedSeverity,
          duration_hours: entry.duration_hours ?? null,
          created_at: entry.created_at,
          admin: entry.admin ?? null,
        } satisfies UserWarningEntry;
      });

      const modHistory = historyRows.map((entry) => {
        const metadata = entry.metadata ?? null;
        const metadataReason =
          metadata && typeof metadata["reason"] === "string"
            ? (metadata["reason"] as string)
            : "No reason provided";
        const targetType = entry.comment_id
          ? "comment"
          : entry.catch_id
            ? "catch"
            : entry.user_id
              ? "profile"
              : report.target_type;
        const targetId = entry.comment_id ?? entry.catch_id ?? entry.user_id ?? report.target_id;

        return {
          id: entry.id,
          action: entry.action,
          target_type: targetType,
          target_id: targetId ?? report.target_id,
          reason: metadataReason,
          details: metadata,
          created_at: entry.created_at,
          admin: entry.admin ?? null,
        } satisfies ModerationLogEntry;
      });

      return {
        targetUserId,
        parentCatchId,
        deletedAt,
        warnCount: warnCount || userWarnings.length,
        moderationStatus,
        suspensionUntil,
        userWarnings,
        modHistory,
        targetProfile,
        targetMissing,
      };
    },
    [user, isAdmin]
  );

  const handleSelectReport = useCallback(
    async (report: ReportRow) => {
      setSelectedReport(report);
      setDetails(null);
      setWarnReason("");
      setWarnSeverity("warning");
      setWarnDuration("24");
      setShowDeleteConfirm(false);
      setShowWarnDialog(false);

      if (!isAdmin) return;

      setDetailsLoading(true);
      try {
        const context = await fetchReportDetails(report);
        setDetails(context);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load moderation details");
      } finally {
        setDetailsLoading(false);
      }
    },
    [fetchReportDetails, isAdmin]
  );

  const handleUpdateStatus = useCallback(
    async (reportId: string, status: ReportStatus) => {
      if (!user || !isAdmin) return;
      setUpdatingId(reportId);

      const { error } = await supabase.rpc(
        "admin_update_report_status" as never,
        {
          p_report_id: reportId,
          p_status: status,
          p_resolution_notes: null,
        } as never
      );

      if (error) {
        toast.error("Unable to update report status");
      } else {
        setReports((prev) => prev.map((report) => (report.id === reportId ? { ...report, status } : report)));
        setSelectedReport((prev) => (prev && prev.id === reportId ? { ...prev, status } : prev));
        toast.success(`Report marked as ${status}`);
      }

      setUpdatingId(null);
    },
    [user, isAdmin]
  );

  const handleViewTarget = useCallback(
    async (report: ReportRow, catchIdFromDetails?: string | null) => {
      if (!report.target_id) {
        toast.error("Unable to open reported content");
        return;
      }

      if (report.target_type === "catch") {
        navigate(`/catch/${report.target_id}`);
        return;
      }

      if (report.target_type === "profile") {
        const candidateUsername =
          selectedReport?.id === report.id ? details?.targetProfile?.username ?? null : null;
        navigate(getProfilePath({ username: candidateUsername, id: report.target_id }));
        return;
      }

      if (report.target_type === "comment") {
        const catchId = catchIdFromDetails;
        if (catchId) {
          navigate(`/catch/${catchId}`);
          return;
        }

        const { data, error } = await supabase
          .from("catch_comments")
          .select("catch_id")
          .eq("id", report.target_id)
          .maybeSingle();

        if (error || !data) {
          toast.error("Unable to open reported comment");
          return;
        }

        navigate(`/catch/${data.catch_id}`);
      }
    },
    [details, navigate, selectedReport]
  );

  const handleDeleteContent = useCallback(async () => {
    if (!selectedReport || !details) return;
    if (!["catch", "comment"].includes(selectedReport.target_type)) return;
    if (details.targetMissing) {
      toast.error("Content record not found");
      return;
    }

    setIsProcessingAction(true);
    try {
      const deleteReason = selectedReport.reason || "Moderator content removal";

      if (selectedReport.target_type === "catch") {
        const { error } = await supabase.rpc("admin_delete_catch", {
          p_catch_id: selectedReport.target_id,
          p_reason: deleteReason,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("admin_delete_comment", {
          p_comment_id: selectedReport.target_id,
          p_reason: deleteReason,
        });
        if (error) throw error;
      }

      toast.success("Content deleted and user notified");
      await handleUpdateStatus(selectedReport.id, "resolved");
      await fetchReports({ silently: true });
      const refreshed = await fetchReportDetails(selectedReport);
      setDetails(refreshed);
    } catch (error) {
      console.error("admin_delete_comment failed", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Unable to delete content";
      toast.error(errorMessage);
    } finally {
      setIsProcessingAction(false);
      setShowDeleteConfirm(false);
    }
  }, [details, fetchReportDetails, fetchReports, handleUpdateStatus, selectedReport]);

  const handleRestoreContent = useCallback(async () => {
    if (!selectedReport || !details) return;
    if (!details.deletedAt) return;

    if (!["catch", "comment"].includes(selectedReport.target_type)) return;

    setIsProcessingAction(true);
    try {
      if (selectedReport.target_type === "catch") {
        const { error } = await supabase.rpc("admin_restore_catch", {
          p_catch_id: selectedReport.target_id,
          p_reason: "Decision overturned",
        });
        if (error) throw error;
      } else {
        console.debug("admin_restore_comment payload", {
          reportId: selectedReport.id,
          targetId: selectedReport.target_id,
        });
        const { error } = await supabase.rpc("admin_restore_comment", {
          p_comment_id: selectedReport.target_id,
          p_reason: "Decision overturned",
        });
        if (error) throw error;
      }

      toast.success("Content restored");
      await fetchReports({ silently: true });
      const refreshed = await fetchReportDetails(selectedReport);
      setDetails(refreshed);
    } catch (error) {
      console.error("admin_restore_comment failed", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Unable to restore content";
      toast.error(errorMessage);
    } finally {
      setIsProcessingAction(false);
    }
  }, [details, fetchReportDetails, fetchReports, selectedReport]);

  const handleWarnUser = useCallback(async () => {
    if (!selectedReport || !details || !details.targetUserId) {
      toast.error("Target user unavailable for moderation");
      return;
    }

    const trimmedReason = warnReason.trim();
    if (!trimmedReason) {
      toast.error("Please provide a reason for the warning");
      return;
    }

    let duration: number | null = null;
    if (warnSeverity === "temporary_suspension") {
      const parsed = parseInt(warnDuration, 10);
      if (Number.isNaN(parsed) || parsed <= 0) {
        toast.error("Enter a valid suspension duration in hours");
        return;
      }
      duration = parsed;
    }

    setIsProcessingAction(true);
    try {
      const payload: Record<string, unknown> = {
        p_user_id: details.targetUserId,
        p_reason: trimmedReason,
        p_severity: warnSeverity,
      };
      if (duration !== null) {
        payload.p_duration_hours = duration;
      }

      const { error } = await supabase.rpc("admin_warn_user" as never, payload as never);
      if (error) throw error;

      toast.success("User moderation action recorded");
      setWarnReason("");
      setWarnSeverity("warning");
      setWarnDuration("24");
      setShowWarnDialog(false);

      await handleUpdateStatus(selectedReport.id, "resolved");
      await fetchReports({ silently: true });
      const refreshed = await fetchReportDetails(selectedReport);
      setDetails(refreshed);
    } catch (error) {
      console.error(error);
      toast.error("Unable to submit warning");
    } finally {
      setIsProcessingAction(false);
    }
  }, [details, fetchReportDetails, fetchReports, handleUpdateStatus, selectedReport, warnDuration, warnReason, warnSeverity]);

  const canLoadMore = reports.length === pageSize * page;

  const resetFilters = useCallback(() => {
    setFilter("all");
    setStatusFilter("open");
    setDateRange("7d");
    setSortOrder("newest");
    setFilteredUserId(null);
    setFilteredUsername(null);
    setPage(1);
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onClear: () => void }[] = [];
    if (filter !== "all") {
      chips.push({ label: `Type: ${filter}`, onClear: () => setFilter("all") });
    }
    if (statusFilter !== "open") {
      chips.push({ label: `Status: ${statusFilter}`, onClear: () => setStatusFilter("open") });
    }
    if (dateRange !== "7d") {
      chips.push({
        label:
          dateRange === "24h"
            ? "Last 24h"
            : dateRange === "30d"
            ? "Last 30 days"
            : dateRange === "all"
            ? "All time"
            : "Last 7 days",
        onClear: () => setDateRange("7d"),
      });
    }
    if (filteredUserId) {
      chips.push({
        label: filteredUsername ? `User: @${filteredUsername}` : "User filter",
        onClear: () => {
          setFilteredUserId(null);
          setFilteredUsername(null);
          navigate("/admin/reports", { replace: true });
          setPage(1);
        },
      });
    }
    return chips;
  }, [dateRange, filter, filteredUserId, filteredUsername, navigate, statusFilter]);

  const handleCloseDetails = () => {
    setSelectedReport(null);
    setDetails(null);
    setShowDeleteConfirm(false);
    setShowWarnDialog(false);
    setWarnReason("");
    setWarnSeverity("warning");
    setWarnDuration("24");
  };

  const typeLabel = filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1);
  const statusLabel =
    statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
  const dateLabel =
    dateRange === "24h"
      ? "24h"
      : dateRange === "7d"
        ? "7 days"
        : dateRange === "30d"
          ? "30 days"
          : "All";
  const filterSummary = `Type: ${typeLabel} • Status: ${statusLabel} • Date: ${dateLabel}`;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-6xl py-6 md:py-8 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={<Eyebrow className="text-muted-foreground">Admin</Eyebrow>}
              title="Reports"
              subtitle="Review and act on user reports."
              titleAs="h1"
              actions={
                <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
                  Back
                </Button>
              }
            />
          </Section>

          <Section>
            <div className="sticky top-16 z-20 space-y-3">
              <Card className="border-border/70 w-full bg-card/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                <CardContent className="space-y-5 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Filter className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Text variant="small" className="font-semibold uppercase tracking-wide">
                        Filters
                      </Text>
                      <Text variant="small">Narrow down the reports queue.</Text>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {activeFilterChips.map((chip, index) => (
                      <Button
                        key={chip.label + index.toString()}
                        variant="secondary"
                        size="sm"
                        className="rounded-full px-3 py-2"
                        onClick={chip.onClear}
                      >
                        {chip.label}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs min-h-[36px]"
                    >
                      Reset filters
                    </Button>
                  </div>
                </div>

                <details className="block sm:hidden rounded-lg border border-border/70 bg-muted/30 p-3">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-border/70 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                    <span className="truncate">{filterSummary}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </summary>
                  <div className="mt-3 space-y-4">
                    <fieldset className="space-y-2 min-w-0">
                      <legend className="text-xs font-medium text-muted-foreground">Type</legend>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                        {(["all", "catch", "comment", "profile"] as const).map((type) => (
                          <Button
                            key={type}
                            variant={filter === type ? "ocean" : "outline"}
                            size="sm"
                            className="w-full sm:w-auto min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center justify-center gap-2"
                            onClick={() => {
                              setFilter(type);
                              setPage(1);
                            }}
                          >
                            {filter === type ? <Check className="h-4 w-4 shrink-0" /> : null}
                            <span className="truncate">
                              {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="space-y-2 min-w-0">
                      <legend className="text-xs font-medium text-muted-foreground">Status</legend>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                        {(["all", "open", "resolved", "dismissed"] as const).map((status) => (
                          <Button
                            key={status}
                            variant={statusFilter === status ? "ocean" : "outline"}
                            size="sm"
                            className="w-full sm:w-auto min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center justify-center gap-2"
                            onClick={() => {
                              setStatusFilter(status);
                              setPage(1);
                            }}
                          >
                            {statusFilter === status ? <Check className="h-4 w-4 shrink-0" /> : null}
                            <span className="truncate">
                              {status === "all"
                                ? "All statuses"
                                : status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="space-y-2 min-w-0">
                      <legend className="text-xs font-medium text-muted-foreground">Date</legend>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                        {(["24h", "7d", "30d", "all"] as const).map((range) => (
                          <Button
                            key={range}
                            variant={dateRange === range ? "ocean" : "ghost"}
                            size="sm"
                            className="w-full sm:w-auto min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center justify-center gap-2"
                            onClick={() => {
                              setDateRange(range);
                              setPage(1);
                            }}
                          >
                            {dateRange === range ? <Check className="h-4 w-4 shrink-0" /> : null}
                            <span className="truncate">
                              {range === "24h"
                                ? "24h"
                                : range === "7d"
                                ? "7 days"
                                : range === "30d"
                                ? "30 days"
                                : "All"}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </details>

                <div className="hidden sm:grid gap-4 md:grid-cols-3">
                  <fieldset className="space-y-2 min-w-0 border-t border-border/50 pt-2 md:border-none md:pt-0">
                    <legend className="text-xs font-medium text-muted-foreground">Type</legend>
                    <div className="flex flex-wrap gap-2 min-w-0">
                      {(["all", "catch", "comment", "profile"] as const).map((type) => (
                        <Button
                          key={type}
                          variant={filter === type ? "ocean" : "outline"}
                          size="sm"
                          className="min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center gap-2"
                          onClick={() => {
                            setFilter(type);
                            setPage(1);
                          }}
                        >
                          {filter === type ? <Check className="h-4 w-4 shrink-0" /> : null}
                          <span className="truncate">{type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </Button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-2 min-w-0 border-t border-border/50 pt-2 md:border-none md:pt-0">
                    <legend className="text-xs font-medium text-muted-foreground">Status</legend>
                    <div className="flex flex-wrap gap-2 min-w-0">
                      {(["all", "open", "resolved", "dismissed"] as const).map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "ocean" : "outline"}
                          size="sm"
                          className="min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center gap-2"
                          onClick={() => {
                            setStatusFilter(status);
                            setPage(1);
                          }}
                        >
                          {statusFilter === status ? <Check className="h-4 w-4 shrink-0" /> : null}
                          <span className="truncate">
                            {status === "all"
                              ? "All statuses"
                              : status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-2 min-w-0 border-t border-border/50 pt-2 md:border-none md:pt-0">
                    <legend className="text-xs font-medium text-muted-foreground">Date</legend>
                    <div className="flex flex-wrap gap-2 min-w-0">
                      {(["24h", "7d", "30d", "all"] as const).map((range) => (
                        <Button
                          key={range}
                          variant={dateRange === range ? "ocean" : "ghost"}
                          size="sm"
                          className="min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center gap-2"
                          onClick={() => {
                            setDateRange(range);
                            setPage(1);
                          }}
                        >
                          {dateRange === range ? <Check className="h-4 w-4 shrink-0" /> : null}
                          <span className="truncate">
                            {range === "24h"
                              ? "24h"
                              : range === "7d"
                              ? "7 days"
                              : range === "30d"
                              ? "30 days"
                              : "All"}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section>
            <Card className="w-full">
              <CardHeader className="sticky top-[calc(4rem+16px)] z-10 bg-card/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                  <Heading as="h2" size="md" className="text-foreground">
                    Reports
                  </Heading>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center min-w-0">
                    <Text variant="small" className="text-muted-foreground min-w-0">Sort</Text>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:rounded-md sm:border sm:border-border/70 sm:overflow-hidden">
                      {(["newest", "oldest"] as const).map((order) => (
                        <Button
                          key={order}
                          variant={sortOrder === order ? "ocean" : "ghost"}
                          size="sm"
                          className="w-full sm:w-auto sm:rounded-none min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px] flex items-center justify-center gap-2"
                          onClick={() => {
                            setSortOrder(order);
                            setPage(1);
                          }}
                        >
                          {order === "newest" ? "Newest first" : "Oldest first"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="border-t border-border/60" />
              <CardContent className="space-y-3 pt-4">
                {isLoading ? (
                  <Text variant="muted" className="text-sm">
                    Loading reports…
                  </Text>
                ) : reports.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-4">
                    <Text variant="muted" className="text-sm">
                      {filteredUserId
                        ? `No reports about ${filteredUsername ? `@${filteredUsername}` : "this user"} match these filters.`
                        : "No reports match these filters right now."}
                    </Text>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Reset filters
                      </Button>
                    </div>
                  </div>
                ) : (
                  reports.map((report) => {
                    const isSelected = selectedReport?.id === report.id;
                    const currentDetails = isSelected ? details : null;
                    const isStatusUpdating = updatingId === report.id;
                    const canDelete =
                      isSelected &&
                      currentDetails &&
                      !currentDetails.targetMissing &&
                      ["catch", "comment"].includes(report.target_type);
                    const canWarn = Boolean(currentDetails?.targetUserId);
                    const canRestore =
                      isSelected &&
                      currentDetails &&
                      Boolean(currentDetails.deletedAt) &&
                      ["catch", "comment"].includes(report.target_type);

                    return (
                      <div key={report.id} className="rounded-lg border border-border/60 bg-card/70 p-3 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
                            <Badge variant="secondary" className="uppercase tracking-wide">
                              {report.target_type}
                            </Badge>
                            <Select
                              value={report.status}
                              onValueChange={(value) => handleUpdateStatus(report.id, value as ReportStatus)}
                              disabled={isStatusUpdating}
                            >
                              <SelectTrigger
                                className="w-full sm:w-40 min-h-[44px]"
                                aria-label={`Report status for ${report.target_type} report`}
                              >
                                <SelectValue placeholder={report.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {(["open", "resolved", "dismissed"] as const).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelative(report.created_at)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary w-full sm:w-auto min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px]"
                              onClick={() => void handleViewTarget(report, currentDetails?.parentCatchId)}
                              disabled={!report.target_id}
                            >
                              <span className="truncate">View target</span>
                            </Button>
                            {isSelected ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full sm:w-auto min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px]"
                                onClick={handleCloseDetails}
                              >
                                <span className="truncate">Close</span>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto min-w-0 whitespace-normal text-sm leading-tight px-3 py-2 min-h-[44px]"
                                onClick={() => void handleSelectReport(report)}
                              >
                                <span className="truncate">Actions</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        <Text className="text-sm text-foreground whitespace-pre-wrap">{report.reason}</Text>
                        <Text variant="muted" className="text-xs">
                          Reported by {report.reporter?.username ?? report.reporter?.id ?? "Unknown"}
                        </Text>

                        {isSelected && (
                          <div className="mt-3 space-y-3">
                            {detailsLoading ? (
                              <Text variant="muted" className="text-sm">
                                Loading moderation context…
                              </Text>
                            ) : currentDetails ? (
                              <>
                                {currentDetails.targetProfile?.id ? (
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground min-w-0">
                                    <Text className="truncate">
                                      Target user: {currentDetails.targetProfile.username ?? currentDetails.targetProfile.id}
                                    </Text>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-primary w-full sm:w-auto"
                                      onClick={() =>
                                        navigate(`/admin/users/${currentDetails.targetProfile?.id}/moderation`, {
                                          state: { from: "reports" },
                                        })
                                      }
                                    >
                                      View moderation history
                                    </Button>
                                  </div>
                                ) : null}

                                {currentDetails.targetMissing && (
                                  <div className="rounded border border-dashed border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                                    The reported content is no longer available.
                                  </div>
                                )}

                                {currentDetails.deletedAt && (
                                  <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                    Content deleted {formatRelative(currentDetails.deletedAt)}.
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded border border-border/60 bg-muted/30 p-3 min-w-0">
                                  <Text className="font-medium">Status:</Text>
                                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeVariants[report.status]}`}>
                                    {report.status.toUpperCase()}
                                  </span>
                                </div>

                                <div className="rounded border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <Text>Moderation status</Text>
                                    <Text className="font-medium capitalize text-right truncate">
                                      {currentDetails.moderationStatus}
                                    </Text>
                                  </div>
                                  {currentDetails.suspensionUntil && (
                                    <Text variant="muted" className="mt-1 text-xs">
                                      Suspended until {new Date(currentDetails.suspensionUntil).toLocaleString()}
                                    </Text>
                                  )}
                                </div>

                                <div className="space-y-2 rounded border border-primary/20 bg-primary/10 p-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <Text>Prior warnings</Text>
                                    <span>
                                      <strong>{currentDetails.warnCount}</strong>/3
                                    </span>
                                  </div>
                                  {currentDetails.userWarnings.length === 0 ? (
                                    <Text variant="muted" className="text-xs">
                                      No prior warnings.
                                    </Text>
                                  ) : (
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      {currentDetails.userWarnings.map((warning) => (
                                        <div key={warning.id} className="rounded border border-border bg-card/60 p-2">
                                          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-primary">
                                            <span>{warning.severity.replace("_", " ")}</span>
                                            <span>{formatRelative(warning.created_at)}</span>
                                          </div>
                                          <Text className="mt-1 text-[13px] text-foreground">{warning.reason}</Text>
                                          {warning.duration_hours && (
                                            <Text variant="muted" className="text-[11px]">
                                              Duration: {warning.duration_hours}h
                                            </Text>
                                          )}
                                          {warning.admin && (
                                            <Text variant="muted" className="text-[11px]">
                                              By {warning.admin.username ?? warning.admin.id ?? "admin"}
                                            </Text>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {canDelete && (
                                    <Button
                                      onClick={() => setShowDeleteConfirm(true)}
                                      disabled={isProcessingAction || isStatusUpdating}
                                      className="px-3 py-2 bg-destructive text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                    >
                                      Delete {report.target_type === "catch" ? "post" : "comment"}
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => setShowWarnDialog(true)}
                                    disabled={!canWarn || isProcessingAction || isStatusUpdating}
                                    className="px-3 py-2 bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                                  >
                                    Warn user
                                  </Button>
                                </div>

                                {canRestore && (
                                  <Button
                                    onClick={() => void handleRestoreContent()}
                                    disabled={isProcessingAction}
                                    className="w-full px-3 py-2 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                  >
                                    Restore {report.target_type === "catch" ? "post" : "comment"}
                                  </Button>
                                )}

                                <details className="rounded border border-border/60 bg-muted/30 p-3">
                                  <summary className="cursor-pointer font-medium">Moderation history</summary>
                                  <div className="mt-3 space-y-3 text-sm">
                                    {currentDetails.modHistory.length === 0 ? (
                                      <Text variant="muted" className="text-xs">
                                        No moderation actions recorded.
                                      </Text>
                                    ) : (
                                      <div className="space-y-3 border-l-2 border-border/60 pl-3">
                                        {currentDetails.modHistory.map((entry) => (
                                          <div key={entry.id} className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="h-2 w-2 rounded-full bg-border" />
                                              <Text className="font-medium truncate">
                                                {entry.admin?.username ?? entry.admin?.id ?? "Unknown admin"} – {entry.action}
                                              </Text>
                                            </div>
                                            <Text className="text-muted-foreground">{entry.reason}</Text>
                                            <Text variant="muted" className="text-xs">
                                              {formatRelative(entry.created_at)}
                                            </Text>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </details>
                              </>
                            ) : (
                              <Text variant="muted" className="text-sm">
                                Unable to load moderation context.
                              </Text>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {!isLoading && reports.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                    <Text variant="muted" className="text-xs">
                      {`Showing ${reports.length} report${reports.length === 1 ? "" : "s"}`}
                    </Text>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
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
                        onClick={() => {
                          if (canLoadMore) {
                            setPage((prev) => prev + 1);
                          }
                        }}
                        disabled={!canLoadMore || isLoading}
                        className="w-full sm:w-auto"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>
        </div>
      </PageContainer>

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !isProcessingAction && setShowDeleteConfirm(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This action hides the content from all users and the owner will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleDeleteContent();
              }}
              disabled={isProcessingAction}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showWarnDialog} onOpenChange={(open) => !isProcessingAction && setShowWarnDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn user</DialogTitle>
            <DialogDescription>
              Issue a warning or suspension. This user currently has
              {" "}
              <strong>{details?.warnCount ?? 0}</strong>
              {" "}/3 warnings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warn-reason">Reason</Label>
              <Textarea
                id="warn-reason"
                value={warnReason}
                onChange={(event) => setWarnReason(event.target.value)}
                placeholder="Explain why this action is being taken"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warn-severity">Severity</Label>
              <Select value={warnSeverity} onValueChange={(value) => setWarnSeverity(value as SeverityOption)}>
                <SelectTrigger id="warn-severity">
                  <SelectValue placeholder="Select a severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {warnSeverity === "temporary_suspension" && (
              <div className="space-y-2">
                <Label htmlFor="warn-duration">Suspension length (hours)</Label>
                <Input
                  id="warn-duration"
                  type="number"
                  min={1}
                  value={warnDuration}
                  onChange={(event) => setWarnDuration(event.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarnDialog(false)} disabled={isProcessingAction}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleWarnUser();
              }}
              disabled={isProcessingAction}
            >
              Send warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
