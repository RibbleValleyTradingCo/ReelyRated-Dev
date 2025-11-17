import type { Database } from "@/integrations/supabase/types";
import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";

export type CatchRow = Database["public"]["Tables"]["catches"]["Row"];
export type DatePreset = "all" | "last-30" | "season" | "last-session" | "custom";

export const WEIGHT_CONVERSION = {
  lb: 0.453592,
  lbs: 0.453592,
  lb_oz: 0.453592,
  kg: 1,
} as const;

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const formatLabel = (value: string) => {
  if (!value) return "";
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ");
};

export const sanitizeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

export const toKg = (weight: number | null, unit: string | null) => {
  if (!weight) return 0;
  if (!unit) return weight;
  const normalizedUnit = unit.toLowerCase();
  const multiplier = WEIGHT_CONVERSION[normalizedUnit as keyof typeof WEIGHT_CONVERSION];
  return multiplier ? weight * multiplier : weight;
};

export const formatWeightDisplay = (kg: number | null) => {
  if (kg === null || Number.isNaN(kg)) {
    return "—";
  }
  const pounds = kg * 2.20462;
  return `${kg.toFixed(1)} kg (${pounds.toFixed(1)} lb)`;
};

export const parseDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const endOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getCatchDate = (catchRow: CatchRow) => parseDate(catchRow.caught_at ?? catchRow.created_at);

export const getCustomField = (catchRow: CatchRow, field: string) => {
  if (!catchRow.conditions || typeof catchRow.conditions !== "object") {
    return undefined;
  }
  const customFields = (catchRow.conditions as Record<string, unknown>).customFields;
  if (!customFields || typeof customFields !== "object") {
    return undefined;
  }
  const value = (customFields as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
};

export const deriveMethodLabel = (catchRow: CatchRow) => {
  const baseMethod = catchRow.method || "";
  if (baseMethod && baseMethod !== "other") {
    return formatLabel(baseMethod);
  }

  const customMethod = getCustomField(catchRow, "method");

  if (customMethod) {
    return formatLabel(customMethod);
  }

  if (baseMethod === "other") {
    return "Other method";
  }

  return "";
};

export const deriveSpeciesLabel = (catchRow: CatchRow) => {
  if (catchRow.species) {
    if (catchRow.species === "other") {
      const customSpecies = getCustomField(catchRow, "species");
      return customSpecies ? formatLabel(customSpecies) : "Other species";
    }
    const label = getFreshwaterSpeciesLabel(catchRow.species);
    return label || formatLabel(catchRow.species);
  }

  const customSpecies = getCustomField(catchRow, "species");
  return customSpecies ? formatLabel(customSpecies) : "";
};

export const deriveTimeOfDayLabel = (catchRow: CatchRow) => {
  if (catchRow.time_of_day) {
    return formatLabel(catchRow.time_of_day);
  }

  const timestamp = catchRow.caught_at ?? catchRow.created_at;
  if (!timestamp) return "Unknown";

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  const hour = parsedDate.getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

export const getConditionValue = (catchRow: CatchRow, key: string) => {
  if (!catchRow.conditions || typeof catchRow.conditions !== "object") {
    return undefined;
  }
  const value = (catchRow.conditions as Record<string, unknown>)[key];
  if (typeof value === "string") {
    return value;
  }
  return undefined;
};

export const getConditionNumber = (catchRow: CatchRow, key: string) => {
  if (!catchRow.conditions || typeof catchRow.conditions !== "object") {
    return undefined;
  }
  const value = (catchRow.conditions as Record<string, unknown>)[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};
