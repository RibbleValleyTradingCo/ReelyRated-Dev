import { useCallback, useEffect, useMemo, useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useAuthLoading } from "@/components/AuthProvider";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Anchor, BarChart3, Layers, CalendarDays, Sparkles, CloudSun, MapPin } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { TrendLineChart } from "@/components/insights/TrendLineChart";
import { StatsCards } from "@/components/insights/StatsCards";
import { FiltersPanel } from "@/components/insights/FiltersPanel";
import { InfoCards } from "@/components/insights/InfoCards";
import { ChartCard } from "@/components/insights/ChartCard";
import {
  type CatchRow,
  type DatePreset,
  DAY_IN_MS,
  formatWeightDisplay,
  parseDate,
  startOfDay,
  endOfDay,
  getCatchDate,
} from "@/lib/insights-utils";
import { type AggregatedStats, aggregateStats } from "@/lib/insights-aggregation";
import { useInsightsChartData } from "@/lib/useInsightsChartData";
import { useInsightsFilters } from "@/lib/useInsightsFilters";
import { createNivoTheme } from "@/lib/nivoTheme";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import EmptyStateCard from "@/components/ui/EmptyStateCard";
import ErrorStateCard from "@/components/ui/ErrorStateCard";
import PageSkeleton from "@/components/ui/PageSkeleton";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type InsightsPanel = "trends" | "species" | "venues" | "sessions";
type CountEntry = { name: string; count: number };
type SessionCountEntry = { session_id: string; count: number };
type MonthlyCountEntry = { label: string; count: number };
type SessionSummary = { id: string; count: number; label: string; dateLabel: string | null };
const EMPTY_SESSIONS: SessionRow[] = [];

type InsightsAggregatesRow = {
  total_catches: number | null;
  total_catches_all: number | null;
  pb_weight: number | null;
  pb_weight_unit: string | null;
  average_weight_kg: number | null;
  weighted_catch_count: number | null;
  average_air_temp: number | null;
  bait_counts: CountEntry[] | null;
  method_counts: CountEntry[] | null;
  time_of_day_counts: CountEntry[] | null;
  species_counts: CountEntry[] | null;
  venue_counts: CountEntry[] | null;
  weather_counts: CountEntry[] | null;
  clarity_counts: CountEntry[] | null;
  wind_counts: CountEntry[] | null;
  monthly_counts: MonthlyCountEntry[] | null;
  session_counts: SessionCountEntry[] | null;
  sessions_count: number | null;
  venue_options: string[] | null;
  latest_session_id: string | null;
};

const sanitizeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");
const normalizeCountEntries = (value: unknown): CountEntry[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is CountEntry =>
      Boolean(entry)
      && typeof (entry as CountEntry).name === "string"
      && typeof (entry as CountEntry).count === "number",
  );
};
const normalizeMonthlyCounts = (value: unknown): MonthlyCountEntry[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is MonthlyCountEntry =>
      Boolean(entry)
      && typeof (entry as MonthlyCountEntry).label === "string"
      && typeof (entry as MonthlyCountEntry).count === "number",
  );
};
const normalizeSessionCounts = (value: unknown): SessionCountEntry[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is SessionCountEntry =>
      Boolean(entry)
      && typeof (entry as SessionCountEntry).session_id === "string"
      && typeof (entry as SessionCountEntry).count === "number",
  );
};

const Insights = () => {
  const { user } = useAuthUser();
  const { loading: authLoading } = useAuthLoading();
  const navigate = useNavigate();
  const [catches, setCatches] = useState<CatchRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCatchesLoading, setIsCatchesLoading] = useState(false);
  const [aggregationMode, setAggregationMode] = useState<"server" | "client">("server");
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [catchesLoaded, setCatchesLoaded] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [selectedVenue, setSelectedVenue] = useState<string>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<InsightsPanel>("trends");

  const rawTrendGradientId = useId();

  const trendGradientId = useMemo(() => sanitizeId(`trend-${rawTrendGradientId}`), [rawTrendGradientId]);

  const primaryColor = "hsl(var(--primary))";
  const secondaryColor = "hsl(var(--secondary))";
  const borderColor = "hsl(var(--border) / 0.35)";
  const nivoTheme = useMemo(() => createNivoTheme(borderColor), [borderColor]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const sessionsQuery = useQuery<SessionRow[]>({
    queryKey: ["insights-sessions", user?.id ?? null],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return [];

      const sessionsResponse = await supabase
        .from("sessions")
        .select("id, title, venue, date, created_at")
        .eq("user_id", user.id)
        .order("date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (sessionsResponse.error) {
        console.warn("Failed to load sessions for insights", sessionsResponse.error);
        return [];
      }

      return (sessionsResponse.data as SessionRow[]) ?? [];
    },
    placeholderData: (previous) => previous,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const isSessionsLoading = sessionsQuery.isLoading;

  const fetchCatches = useCallback(async () => {
    if (!user) return;
    setIsCatchesLoading(true);
    setError(null);

    const catchesResponse = await supabase
      .from("catches")
      .select(
        "id, created_at, caught_at, weight, weight_unit, location, bait_used, method, time_of_day, conditions, session_id, species"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (catchesResponse.error) {
      setError("We couldn't load your catches right now. Please try again shortly.");
      setCatches([]);
    } else {
      setCatches((catchesResponse.data as CatchRow[]) ?? []);
    }

    setIsCatchesLoading(false);
    setCatchesLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!user || aggregationMode !== "client" || catchesLoaded) return;
    void fetchCatches();
  }, [user, aggregationMode, catchesLoaded, fetchCatches]);

  const aggregatesQuery = useQuery<InsightsAggregatesRow>({
    queryKey: [
      "insights-aggregates",
      user?.id ?? null,
      datePreset,
      customRange?.from?.toISOString() ?? null,
      customRange?.to?.toISOString() ?? null,
      selectedSessionId !== "all" ? selectedSessionId : null,
      selectedVenue !== "all" ? selectedVenue : null,
    ],
    enabled: Boolean(user) && aggregationMode === "server",
    queryFn: async () => {
      const { data, error: aggregatesError } = await supabase.rpc("get_insights_aggregates", {
        p_date_preset: datePreset,
        p_custom_start: customRange?.from ?? null,
        p_custom_end: customRange?.to ?? null,
        p_selected_session_id: selectedSessionId !== "all" ? selectedSessionId : null,
        p_selected_venue: selectedVenue !== "all" ? selectedVenue : null,
      });

      if (aggregatesError) {
        throw aggregatesError;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        throw new Error("Insights aggregates RPC returned no data.");
      }

      return row as InsightsAggregatesRow;
    },
    placeholderData: (previous) => previous,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  useEffect(() => {
    if (aggregationMode !== "server") return;

    if (aggregatesQuery.isError) {
      console.warn("Insights aggregates RPC failed", aggregatesQuery.error);
      setAggregationMode("client");
      setFallbackNotice((previous) => previous ?? "Using local insights while we refresh analytics.");
      return;
    }

    if (aggregatesQuery.isSuccess && fallbackNotice) {
      setFallbackNotice(null);
    }
  }, [aggregationMode, aggregatesQuery.isError, aggregatesQuery.isSuccess, aggregatesQuery.error, fallbackNotice]);

  const serverAggregates = aggregatesQuery.data ?? null;
  const usingServerData = aggregationMode === "server" && Boolean(serverAggregates);
  const isAggregatesLoading = aggregationMode === "server" ? aggregatesQuery.isLoading : false;
  const isPageLoading = authLoading
    || isSessionsLoading
    || (aggregationMode === "server" ? isAggregatesLoading : isCatchesLoading);

  const venueOptions = useMemo(() => {
    if (usingServerData && serverAggregates?.venue_options && Array.isArray(serverAggregates.venue_options)) {
      return serverAggregates.venue_options.filter((venue) => typeof venue === "string" && venue.trim().length > 0);
    }

    const venues = new Set<string>();
    catches.forEach((catchRow) => {
      if (catchRow.location) {
        venues.add(catchRow.location);
      }
    });
    return Array.from(venues).sort((a, b) => a.localeCompare(b));
  }, [usingServerData, serverAggregates, catches]);

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => {
        const sessionDate = session.date ? parseDate(session.date) : parseDate(session.created_at);
        const fallbackLabel = sessionDate ? sessionDate.toLocaleDateString() : `Session ${session.id.slice(0, 6)}`;
        return {
          value: session.id,
          label: session.title ? session.title : fallbackLabel,
        };
      }),
    [sessions]
  );

  useEffect(() => {
    if (selectedVenue !== "all" && !venueOptions.includes(selectedVenue)) {
      setSelectedVenue("all");
    }
  }, [venueOptions, selectedVenue]);

  useEffect(() => {
    if (selectedSessionId !== "all" && !sessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId("all");
    }
  }, [sessions, selectedSessionId]);

  const clientLatestSessionId = useMemo(() => {
    let candidate: { id: string; timestamp: number } | null = null;

    catches.forEach((catchRow) => {
      if (!catchRow.session_id) return;
      const catchDate = getCatchDate(catchRow);
      const timestamp = catchDate ? catchDate.getTime() : 0;
      if (!candidate || timestamp > candidate.timestamp) {
        candidate = { id: catchRow.session_id, timestamp };
      }
    });

    if (candidate) {
      return candidate.id;
    }

    let fallback: { id: string; timestamp: number } | null = null;
    sessions.forEach((session) => {
      const sessionDate = session.date ? parseDate(session.date) : parseDate(session.created_at);
      const timestamp = sessionDate ? sessionDate.getTime() : 0;
      if (!fallback || timestamp > fallback.timestamp) {
        fallback = { id: session.id, timestamp };
      }
    });

    return fallback?.id ?? null;
  }, [catches, sessions]);

  const latestSessionId = usingServerData ? (serverAggregates?.latest_session_id ?? null) : clientLatestSessionId;

  useEffect(() => {
    if (datePreset === "last-session" && latestSessionId) {
      setSelectedSessionId((previous) => (previous === latestSessionId ? previous : latestSessionId));
    }
  }, [datePreset, latestSessionId]);

  const effectiveSessionId = useMemo(() => {
    if (selectedSessionId !== "all") {
      return selectedSessionId;
    }
    if (datePreset === "last-session" && latestSessionId) {
      return latestSessionId;
    }
    return null;
  }, [selectedSessionId, datePreset, latestSessionId]);

  const { filteredCatches } = useInsightsFilters({
    catches,
    sessions,
    datePreset,
    customRange,
    effectiveSessionId,
    selectedVenue,
  });

  const clientStats = useMemo(() => aggregateStats(filteredCatches), [filteredCatches]);

  const clientSessionsCount = useMemo(() => {
    if (effectiveSessionId) {
      return filteredCatches.some((catchRow) => catchRow.session_id === effectiveSessionId) ? 1 : 0;
    }
    const ids = new Set<string>();
    filteredCatches.forEach((catchRow) => {
      if (catchRow.session_id) {
        ids.add(catchRow.session_id);
      }
    });
    return ids.size;
  }, [filteredCatches, effectiveSessionId]);

  const clientChartData = useInsightsChartData({ filteredCatches, sessions, stats: clientStats });

  const serverStats = useMemo<AggregatedStats | null>(() => {
    if (!serverAggregates) return null;

    const baitCounts = normalizeCountEntries(serverAggregates.bait_counts);
    const methodCounts = normalizeCountEntries(serverAggregates.method_counts);
    const timeOfDayCounts = normalizeCountEntries(serverAggregates.time_of_day_counts);
    const speciesCounts = normalizeCountEntries(serverAggregates.species_counts);
    const venueCounts = normalizeCountEntries(serverAggregates.venue_counts);
    const weatherCounts = normalizeCountEntries(serverAggregates.weather_counts);
    const clarityCounts = normalizeCountEntries(serverAggregates.clarity_counts);
    const windCounts = normalizeCountEntries(serverAggregates.wind_counts);

    const pbCatch = serverAggregates.pb_weight !== null && serverAggregates.pb_weight !== undefined
      ? {
          weight: serverAggregates.pb_weight,
          unit: serverAggregates.pb_weight_unit ?? null,
          label: serverAggregates.pb_weight
            ? `${serverAggregates.pb_weight} ${serverAggregates.pb_weight_unit ? serverAggregates.pb_weight_unit.toLowerCase() : ""}`.trim()
            : "No weight recorded",
        }
      : null;

    return {
      totalCatches: serverAggregates.total_catches ?? 0,
      pbCatch,
      topVenue: venueCounts[0]?.name ?? null,
      topTimeOfDay: timeOfDayCounts[0]?.name ?? null,
      baitCounts,
      methodCounts,
      timeOfDayCounts,
      speciesCounts,
      venueCounts,
      weatherCounts,
      clarityCounts,
      windCounts,
      averageWeightKg: serverAggregates.average_weight_kg ?? null,
      totalWeightKg: 0,
      averageAirTemp: serverAggregates.average_air_temp ?? null,
      weightedCatchCount: serverAggregates.weighted_catch_count ?? 0,
    };
  }, [serverAggregates]);

  const serverSessionsCount = useMemo(() => {
    if (!serverAggregates) return 0;
    if (typeof serverAggregates.sessions_count === "number") {
      return serverAggregates.sessions_count;
    }
    return normalizeSessionCounts(serverAggregates.session_counts).length;
  }, [serverAggregates]);

  const serverChartData = useMemo(() => {
    if (!serverAggregates) return null;

    const monthlyCounts = normalizeMonthlyCounts(serverAggregates.monthly_counts);
    const trendLineData = monthlyCounts.length > 0
      ? [{
          id: "Catches",
          data: monthlyCounts.map((entry) => ({ x: entry.label, y: entry.count })),
        }]
      : [];

    const timeOfDayData = normalizeCountEntries(serverAggregates.time_of_day_counts)
      .map((entry) => ({ label: entry.name, catches: entry.count }));
    const baitData = normalizeCountEntries(serverAggregates.bait_counts)
      .map((entry) => ({ label: entry.name, catches: entry.count }));
    const methodData = normalizeCountEntries(serverAggregates.method_counts)
      .map((entry) => ({ label: entry.name, catches: entry.count }));
    const speciesBarData = normalizeCountEntries(serverAggregates.species_counts)
      .map((entry) => ({ label: entry.name, catches: entry.count }));
    const venueLeaderboard = normalizeCountEntries(serverAggregates.venue_counts);

    const sessionCounts = normalizeSessionCounts(serverAggregates.session_counts);
    const sessionSummaries: SessionSummary[] = sessionCounts
      .map((entry) => {
        const session = sessions.find((item) => item.id === entry.session_id);
        const label = session?.title ? session.title : `Session ${entry.session_id.slice(0, 6)}`;
        const dateLabel = session?.date
          ? new Date(session.date).toLocaleDateString()
          : session?.created_at
          ? new Date(session.created_at).toLocaleDateString()
          : null;
        return { id: entry.session_id, count: entry.count, label, dateLabel };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topSession = sessionSummaries[0] ?? null;

    return {
      venueLeaderboard,
      monthlyCounts,
      sessionSummaries,
      topSession,
      trendLineData,
      timeOfDayData,
      baitData,
      methodData,
      speciesBarData,
    };
  }, [serverAggregates, sessions]);

  const stats = usingServerData && serverStats ? serverStats : clientStats;
  const sessionsCount = usingServerData ? serverSessionsCount : clientSessionsCount;
  const {
    venueLeaderboard,
    monthlyCounts,
    sessionSummaries,
    topSession,
    trendLineData,
    timeOfDayData,
    baitData,
    methodData,
    speciesBarData,
  } = usingServerData && serverChartData ? serverChartData : clientChartData;

  const mostCommonSpecies = stats.speciesCounts[0]?.name ?? null;
  const mostCommonSpeciesCount = stats.speciesCounts[0]?.count ?? 0;
  const averageWeightLabel = formatWeightDisplay(stats.averageWeightKg);
  const weightedCatchCount = stats.weightedCatchCount;
  const averagePerSession = sessionsCount > 0 ? stats.totalCatches / sessionsCount : 0;
  const averagePerSessionLabel = sessionsCount > 0 ? averagePerSession.toFixed(1) : "—";
  const topWeather = stats.weatherCounts[0]?.name ?? null;
  const topClarity = stats.clarityCounts[0]?.name ?? null;
  const topWind = stats.windCounts[0]?.name ?? null;
  const averageAirTempLabel = stats.averageAirTemp !== null ? `${stats.averageAirTemp.toFixed(1)}°C` : "—";
  const topVenue = venueLeaderboard[0] ?? null;

  const peakMonthEntry =
    monthlyCounts.length > 0
      ? monthlyCounts.reduce((best, entry) => (entry.count > (best?.count ?? 0) ? entry : best), monthlyCounts[0])
      : null;

  const catchTrendSummary = peakMonthEntry
    ? `Peak month: ${peakMonthEntry.label} (${peakMonthEntry.count} catch${peakMonthEntry.count === 1 ? "" : "es"})`
    : "No monthly data yet.";

  const totalTimeOfDayCatches = timeOfDayData.reduce((sum, item) => sum + item.catches, 0);
  const topTimeOfDayBucket =
    timeOfDayData.length > 0
      ? timeOfDayData.reduce(
          (best, entry) => (entry.catches > (best?.catches ?? 0) ? entry : best),
          timeOfDayData[0],
        )
      : null;
  const showTimeOfDayChart = totalTimeOfDayCatches >= 3 && timeOfDayData.length > 0;
  const timeOfDaySummary = topTimeOfDayBucket
    ? `Most fish landed during ${topTimeOfDayBucket.label.toLowerCase()} hours.`
    : null;

  const topMethod = methodData[0];
  const methodFooter = topMethod
    ? `Most fish landed on: ${topMethod.label} (${topMethod.catches} catch${topMethod.catches === 1 ? "" : "es"})`
    : undefined;

  const topVenueHighlight = topVenue
    ? `Top venue: ${topVenue.name} (${topVenue.count} catch${topVenue.count === 1 ? "" : "es"})`
    : null;

  const sessionsDisabled = sessionOptions.length === 0;
  const showLastSessionHint = datePreset === "last-session" && !latestSessionId;
  const noCatchesOverall = usingServerData
    ? (serverAggregates?.total_catches_all ?? 0) === 0
    : catches.length === 0;

  const customRangeLabel = useMemo(() => {
    if (customRange?.from && customRange?.to) {
      return `${customRange.from.toLocaleDateString()} – ${customRange.to.toLocaleDateString()}`;
    }
    if (customRange?.from) {
      return `${customRange.from.toLocaleDateString()} – …`;
    }
    return "Pick custom range";
  }, [customRange]);

  const customRangeActive = datePreset === "custom";

  const handleDatePresetChange = useCallback((value: DatePreset) => {
    if (value === "last-session" && !latestSessionId) {
      setDatePreset("all");
      return;
    }

    if (value === "custom") {
      setDatePreset("custom");
      setCustomRangeOpen(true);
      return;
    }

    setCustomRange(undefined);
    setCustomRangeOpen(false);
    setDatePreset(value);
  }, [latestSessionId]);

  const handleCustomRangeSelect = useCallback((range: DateRange | undefined) => {
    if (!range || (!range.from && !range.to)) {
      setCustomRange(undefined);
      setDatePreset("all");
      return;
    }
    setCustomRange(range);
    setDatePreset("custom");
    setSelectedSessionId("all");
    if (range.from && range.to) {
      setCustomRangeOpen(false);
    }
  }, []);

  const handleClearCustomRange = useCallback(() => {
    setCustomRange(undefined);
    if (datePreset === "custom") {
      setDatePreset("all");
    }
    setCustomRangeOpen(false);
  }, [datePreset]);

  const handleSessionChange = useCallback((value: string) => {
    if (datePreset === "last-session") {
      if (value === "all" || (latestSessionId && value !== latestSessionId)) {
        setDatePreset("all");
      }
    }
    setSelectedSessionId(value);
  }, [datePreset, latestSessionId]);

  const handleVenueChange = useCallback((value: string) => {
    setSelectedVenue(value);
  }, []);

  const chartTabs = [
    { id: "trends" as const, label: "Trends", icon: BarChart3 },
    { id: "species" as const, label: "Species", icon: Sparkles },
    { id: "venues" as const, label: "Venues", icon: MapPin },
    { id: "sessions" as const, label: "Sessions", icon: Layers },
  ];

  const hasConditionsData =
    Boolean(stats.topTimeOfDay || topWeather || topClarity || topWind) || stats.averageAirTemp !== null;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
        <PageContainer className="py-8 md:py-10">
          <PageSkeleton sections={3} />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <PageContainer className="py-8 md:py-10">
        <div className="space-y-10 md:space-y-12">
          <Section className="space-y-2">
            <SectionHeader
              title="Your angling insights"
              subtitle="A quick look at how your catches stack up across venues, times of day, and favourite tactics."
              titleAs="h1"
            />
          </Section>

          {error ? (
            <Section className="space-y-4">
              <ErrorStateCard title="Insights unavailable" message={error} />
            </Section>
          ) : (
            <>
              <Section className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Heading as="h3" size="sm" className="text-foreground">
                      Filters
                    </Heading>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="md:hidden"
                      aria-expanded={filtersOpen}
                      aria-controls="insights-filters"
                      onClick={() => setFiltersOpen((prev) => !prev)}
                    >
                      {filtersOpen ? "Hide filters" : "Show filters"}
                    </Button>
                  </div>
                  <div id="insights-filters" className={cn(filtersOpen ? "block" : "hidden", "md:block")}>
                    <div className="w-full min-w-0">
                      <FiltersPanel
                        datePreset={datePreset}
                        onDatePresetChange={handleDatePresetChange}
                        selectedSessionId={selectedSessionId}
                        onSessionChange={handleSessionChange}
                        selectedVenue={selectedVenue}
                        onVenueChange={handleVenueChange}
                        customRange={customRange}
                        customRangeOpen={customRangeOpen}
                        onCustomRangeOpenChange={setCustomRangeOpen}
                        onCustomRangeSelect={handleCustomRangeSelect}
                        onClearCustomRange={handleClearCustomRange}
                        customRangeLabel={customRangeLabel}
                        customRangeActive={customRangeActive}
                        latestSessionId={latestSessionId}
                        sessionOptions={sessionOptions}
                        sessionsDisabled={sessionsDisabled}
                        venueOptions={venueOptions}
                        showLastSessionHint={showLastSessionHint}
                      />
                    </div>
                  </div>
                </div>
                {fallbackNotice ? (
                  <div role="status">
                    <Text variant="small">{fallbackNotice}</Text>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key metrics</Text>
                  <div className="[&>div>div]:min-h-[140px]">
                    <StatsCards
                      totalCatches={stats.totalCatches}
                      pbLabel={stats.pbCatch?.label ?? "—"}
                      averageWeightLabel={averageWeightLabel}
                      weightedCatchCount={weightedCatchCount}
                      sessionsCount={sessionsCount}
                      averagePerSessionLabel={averagePerSessionLabel}
                      mostCommonSpecies={mostCommonSpecies}
                      mostCommonSpeciesCount={mostCommonSpeciesCount}
                    />
                  </div>
                </div>
              </Section>

              {stats.totalCatches === 0 ? (
                <Section className="space-y-4">
                  <EmptyStateCard
                    title="No insights yet"
                    message={
                      noCatchesOverall
                        ? "You have not logged any catches yet. Record your next session to unlock insights."
                        : "No catches match these filters yet. Adjust your selections or log a new trip to see data here."
                    }
                    actionLabel="Log a catch"
                    onAction={() => navigate("/add-catch")}
                  />
                </Section>
              ) : (
                <>
                  <Section className="space-y-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <Heading as="h2" size="md" className="text-foreground">
                          Deep dive
                        </Heading>
                        <Text variant="muted">Switch panels to explore trends, species, venues, and sessions.</Text>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {chartTabs.map((tab) => {
                          const isActive = activePanel === tab.id;
                          const Icon = tab.icon;
                          return (
                            <Button
                              key={tab.id}
                              type="button"
                              variant={isActive ? "secondary" : "outline"}
                              className={cn(
                                "w-full h-9 sm:w-auto",
                                isActive
                                  ? "border-transparent"
                                  : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                              )}
                              aria-pressed={isActive}
                              onClick={() => setActivePanel(tab.id)}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {tab.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-card md:p-6">
                    {activePanel === "trends" && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Heading as="h3" size="sm" className="text-foreground">
                            Trends
                          </Heading>
                          <Text variant="muted">
                            Monthly totals and time-of-day patterns.
                          </Text>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                          <div className="[&>div]:h-full [&>div]:flex [&>div]:flex-col">
                            <ChartCard
                              icon={CalendarDays}
                              title="Catch trend"
                              description="Monthly totals."
                              isEmpty={monthlyCounts.length === 0}
                              emptyMessage="No monthly data yet."
                              footer={peakMonthEntry ? catchTrendSummary : undefined}
                            >
                              <div className="min-h-[220px] md:min-h-[280px]">
                                <TrendLineChart
                                  data={trendLineData}
                                  theme={nivoTheme}
                                  color={primaryColor}
                                  gradientId={trendGradientId}
                                />
                              </div>
                            </ChartCard>
                          </div>

                          <div className="space-y-6">
                            <ChartCard
                              icon={BarChart3}
                              title="Time of day performance"
                              description="Catches by time bucket."
                              isEmpty={!showTimeOfDayChart}
                              emptyMessage="Not enough data yet."
                              footer={showTimeOfDayChart ? timeOfDaySummary : undefined}
                            >
                              <Text className="text-sm text-foreground">
                                Most fish landed during{" "}
                                <span className="font-semibold">{topTimeOfDayBucket?.label?.toLowerCase()} hours</span>.
                              </Text>
                            </ChartCard>

                            <ChartCard
                              icon={CloudSun}
                              title="Conditions snapshot"
                              description="Weather and clarity patterns."
                              isEmpty={!hasConditionsData}
                              emptyMessage="No conditions data yet."
                            >
                              <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Prime time</span>
                                  <span className="font-medium text-foreground">{stats.topTimeOfDay ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Favourite weather</span>
                                  <span className="font-medium text-foreground">{topWeather ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Water clarity sweet spot</span>
                                  <span className="font-medium text-foreground">{topClarity ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Prevailing wind</span>
                                  <span className="font-medium text-foreground">{topWind ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Average air temp</span>
                                  <span className="font-medium text-foreground">{averageAirTempLabel}</span>
                                </div>
                              </div>
                            </ChartCard>
                          </div>
                        </div>
                      </div>
                    )}

                    {activePanel === "species" && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Heading as="h3" size="sm" className="text-foreground">
                            Species breakdown
                          </Heading>
                          <Text variant="muted">
                            Species mix and bait choices in this range.
                          </Text>
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <div className="[&>div]:h-full">
                            <ChartCard
                              icon={Sparkles}
                              title="Species mix"
                              description="Top species by catch count."
                              isEmpty={speciesBarData.length === 0}
                              emptyMessage="No species data yet."
                            >
                              {speciesBarData.length > 0 ? (
                                <ol className="space-y-2 text-sm">
                                  {speciesBarData.slice(0, 5).map((item, index) => (
                                    <li key={item.label} className="flex items-center justify-between gap-4">
                                      <span className="font-medium text-foreground">
                                        {index + 1}. {item.label}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {item.catches} catch{item.catches === 1 ? "" : "es"}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              ) : null}
                            </ChartCard>
                          </div>

                          <div className="[&>div]:h-full">
                            <ChartCard
                              icon={Anchor}
                              title="Favourite baits"
                              description="Most used baits."
                              isEmpty={baitData.length === 0}
                              emptyMessage="No bait data yet."
                            >
                              {baitData.length > 0 ? (
                                <ol className="space-y-2 text-sm">
                                  {baitData.slice(0, 5).map((item, index) => (
                                    <li key={item.label} className="flex items-center justify-between gap-4">
                                      <span className="font-medium text-foreground">
                                        {index + 1}. {item.label}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {item.catches} catch{item.catches === 1 ? "" : "es"}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              ) : null}
                            </ChartCard>
                          </div>
                        </div>
                      </div>
                    )}

                    {activePanel === "venues" && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Heading as="h3" size="sm" className="text-foreground">
                            Venues
                          </Heading>
                          <Text variant="muted">
                            Where you catch the most fish and which methods pay off.
                          </Text>
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <div className="[&>div]:h-full">
                            <ChartCard
                              icon={Anchor}
                              title="Productive methods"
                              description="Techniques ranked by catches."
                              isEmpty={methodData.length === 0}
                              emptyMessage="No method data yet."
                              footer={methodFooter}
                            >
                              {methodData.length > 0 ? (
                                <ol className="space-y-2 text-sm">
                                  {methodData.slice(0, 5).map((item, index) => (
                                    <li key={item.label} className="flex items-center justify-between gap-4">
                                      <span className="font-medium text-foreground">
                                        {index + 1}. {item.label}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {item.catches} catch{item.catches === 1 ? "" : "es"}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              ) : null}
                            </ChartCard>
                          </div>

                          <InfoCards
                            topTimeOfDay={stats.topTimeOfDay}
                            topWeather={topWeather}
                            topClarity={topClarity}
                            topWind={topWind}
                            averageAirTempLabel={averageAirTempLabel}
                            venueLeaderboard={venueLeaderboard}
                            sessionsCount={sessionsCount}
                            averagePerSessionLabel={averagePerSessionLabel}
                            sessionSummaries={sessionSummaries}
                            topSession={topSession}
                            topVenueHighlight={topVenueHighlight}
                            sections={["venues"]}
                          />
                        </div>
                      </div>
                    )}

                    {activePanel === "sessions" && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Heading as="h3" size="sm" className="text-foreground">
                            Sessions
                          </Heading>
                          <Text variant="muted">
                            Highlights from your logged trips.
                          </Text>
                        </div>
                        <InfoCards
                          topTimeOfDay={stats.topTimeOfDay}
                          topWeather={topWeather}
                          topClarity={topClarity}
                          topWind={topWind}
                          averageAirTempLabel={averageAirTempLabel}
                          venueLeaderboard={venueLeaderboard}
                          sessionsCount={sessionsCount}
                          averagePerSessionLabel={averagePerSessionLabel}
                          sessionSummaries={sessionSummaries}
                          topSession={topSession}
                          topVenueHighlight={topVenueHighlight}
                          sections={["sessions"]}
                        />
                      </div>
                    )}
                  </div>
                </Section>
                </>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </div>
  );
};

export default Insights;
