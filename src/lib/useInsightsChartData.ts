import { useMemo } from "react";
import type { CatchRow } from "./insights-utils";
import { getCatchDate } from "./insights-utils";
import type { AggregatedStats } from "./insights-aggregation";

type SessionRow = {
  id: string;
  title: string | null;
  date: string | null;
  created_at: string;
};

interface UseInsightsChartDataParams {
  filteredCatches: CatchRow[];
  sessions: SessionRow[];
  stats: AggregatedStats;
}

export const useInsightsChartData = ({ filteredCatches, sessions, stats }: UseInsightsChartDataParams) => {
  const speciesChartData = useMemo(() => stats.speciesCounts.slice(0, 6), [stats.speciesCounts]);

  const venueLeaderboard = useMemo(() => stats.venueCounts.slice(0, 5), [stats.venueCounts]);

  const monthlyCounts = useMemo(() => {
    const counts = new Map<string, { date: Date; count: number }>();
    filteredCatches.forEach((catchRow) => {
      const date = getCatchDate(catchRow);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!counts.has(key)) {
        counts.set(key, { date: new Date(date.getFullYear(), date.getMonth(), 1), count: 0 });
      }
      counts.get(key)!.count += 1;
    });

    const sorted = Array.from(counts.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    const recent = sorted.slice(-12);
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });
    return recent.map((entry) => ({ label: formatter.format(entry.date), count: entry.count }));
  }, [filteredCatches]);

  const sessionSummaries = useMemo(() => {
    const map = new Map<string, number>();
    filteredCatches.forEach((catchRow) => {
      if (catchRow.session_id) {
        map.set(catchRow.session_id, (map.get(catchRow.session_id) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([sessionId, count]) => {
        const session = sessions.find((item) => item.id === sessionId);
        const label = session?.title ? session.title : `Session ${sessionId.slice(0, 6)}`;
        const dateLabel = session?.date
          ? new Date(session.date).toLocaleDateString()
          : session?.created_at
          ? new Date(session.created_at).toLocaleDateString()
          : null;
        return { id: sessionId, count, label, dateLabel };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredCatches, sessions]);

  const topSession = sessionSummaries[0] ?? null;

  const trendLineData = useMemo(() => {
    if (!monthlyCounts.length) return [];
    return [
      {
        id: "Catches",
        data: monthlyCounts.map((entry) => ({ x: entry.label, y: entry.count })),
      },
    ];
  }, [monthlyCounts]);

  const timeOfDayData = useMemo(
    () => stats.timeOfDayCounts.map((item) => ({ label: item.name, catches: item.count })),
    [stats.timeOfDayCounts]
  );

  const baitData = useMemo(
    () => stats.baitCounts.map((item) => ({ label: item.name, catches: item.count })),
    [stats.baitCounts]
  );

  const methodData = useMemo(
    () => stats.methodCounts.map((item) => ({ label: item.name, catches: item.count })),
    [stats.methodCounts]
  );

  const speciesBarData = useMemo(
    () => speciesChartData.map((item) => ({ label: item.name, catches: item.count })),
    [speciesChartData]
  );

  return {
    speciesChartData,
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
};
