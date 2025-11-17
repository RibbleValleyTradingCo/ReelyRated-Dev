import { useMemo } from "react";
import type { CatchRow, DatePreset } from "./insights-utils";
import { DAY_IN_MS, startOfDay, endOfDay, parseDate, getCatchDate } from "./insights-utils";
import type { DateRange } from "react-day-picker";

type SessionRow = {
  id: string;
  date: string | null;
  created_at: string;
};

interface UseInsightsFiltersParams {
  catches: CatchRow[];
  sessions: SessionRow[];
  datePreset: DatePreset;
  customRange: DateRange | undefined;
  effectiveSessionId: string | null;
  selectedVenue: string;
}

export const useInsightsFilters = ({
  catches,
  sessions,
  datePreset,
  customRange,
  effectiveSessionId,
  selectedVenue,
}: UseInsightsFiltersParams) => {
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "last-30": {
        const end = endOfDay(now);
        const start = startOfDay(new Date(now.getTime() - 29 * DAY_IN_MS));
        return { start, end };
      }
      case "season": {
        const start = startOfDay(new Date(now.getFullYear(), 0, 1));
        const end = endOfDay(now);
        return { start, end };
      }
      case "custom": {
        if (!customRange) {
          return { start: null, end: null };
        }
        const start = customRange.from ? startOfDay(customRange.from) : null;
        const end = customRange.to
          ? endOfDay(customRange.to)
          : customRange.from
          ? endOfDay(customRange.from)
          : null;
        return { start, end };
      }
      case "last-session": {
        if (!effectiveSessionId) {
          return { start: null, end: null };
        }
        const sessionCatches = catches.filter((catchRow) => catchRow.session_id === effectiveSessionId);
        const timestamps = sessionCatches
          .map((catchRow) => getCatchDate(catchRow))
          .filter((date): date is Date => Boolean(date))
          .map((date) => date.getTime());

        if (timestamps.length > 0) {
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          return { start: startOfDay(new Date(minTime)), end: endOfDay(new Date(maxTime)) };
        }

        const session = sessions.find((item) => item.id === effectiveSessionId);
        if (session?.date) {
          const sessionDate = parseDate(session.date);
          if (sessionDate) {
            return { start: startOfDay(sessionDate), end: endOfDay(sessionDate) };
          }
        }

        return { start: null, end: null };
      }
      default:
        return { start: null, end: null };
    }
  }, [datePreset, catches, sessions, effectiveSessionId, customRange]);

  const filteredCatches = useMemo(() => {
    return catches.filter((catchRow) => {
      if (effectiveSessionId && catchRow.session_id !== effectiveSessionId) {
        return false;
      }

      if (selectedVenue !== "all") {
        if (!catchRow.location || catchRow.location !== selectedVenue) {
          return false;
        }
      }

      const catchDate = getCatchDate(catchRow);

      if (dateRange.start && (!catchDate || catchDate < dateRange.start)) {
        return false;
      }

      if (dateRange.end && (!catchDate || catchDate > dateRange.end)) {
        return false;
      }

      return true;
    });
  }, [catches, effectiveSessionId, selectedVenue, dateRange]);

  return {
    dateRange,
    filteredCatches,
  };
};
