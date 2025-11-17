import type { CatchRow } from "./insights-utils";
import {
  formatLabel,
  deriveMethodLabel,
  deriveSpeciesLabel,
  deriveTimeOfDayLabel,
  toKg,
  getConditionValue,
  getConditionNumber,
} from "./insights-utils";

export type AggregatedStats = {
  totalCatches: number;
  pbCatch: { weight: number | null; unit: string | null; label: string } | null;
  topVenue: string | null;
  topTimeOfDay: string | null;
  baitCounts: { name: string; count: number }[];
  methodCounts: { name: string; count: number }[];
  timeOfDayCounts: { name: string; count: number }[];
  speciesCounts: { name: string; count: number }[];
  venueCounts: { name: string; count: number }[];
  weatherCounts: { name: string; count: number }[];
  clarityCounts: { name: string; count: number }[];
  windCounts: { name: string; count: number }[];
  averageWeightKg: number | null;
  totalWeightKg: number;
  averageAirTemp: number | null;
  weightedCatchCount: number;
};

export const aggregateStats = (catches: CatchRow[]): AggregatedStats => {
  if (!catches.length) {
    return {
      totalCatches: 0,
      pbCatch: null,
      topVenue: null,
      topTimeOfDay: null,
      baitCounts: [],
      methodCounts: [],
      timeOfDayCounts: [],
      speciesCounts: [],
      venueCounts: [],
      weatherCounts: [],
      clarityCounts: [],
      windCounts: [],
      averageWeightKg: null,
      totalWeightKg: 0,
      averageAirTemp: null,
      weightedCatchCount: 0,
    };
  }

  const baitMap = new Map<string, number>();
  const methodMap = new Map<string, number>();
  const venueMap = new Map<string, number>();
  const timeOfDayMap = new Map<string, number>();
  const speciesMap = new Map<string, number>();
  const weatherMap = new Map<string, number>();
  const clarityMap = new Map<string, number>();
  const windMap = new Map<string, number>();

  let pb: CatchRow | null = null;
  let weightSumKg = 0;
  let weightCount = 0;
  let airTempSum = 0;
  let airTempCount = 0;

  catches.forEach((catchRow) => {
    if (catchRow.bait_used) {
      const baitLabel = formatLabel(catchRow.bait_used);
      baitMap.set(baitLabel, (baitMap.get(baitLabel) || 0) + 1);
    }

    const methodLabel = deriveMethodLabel(catchRow);
    if (methodLabel) {
      methodMap.set(methodLabel, (methodMap.get(methodLabel) || 0) + 1);
    }

    if (catchRow.location) {
      venueMap.set(catchRow.location, (venueMap.get(catchRow.location) || 0) + 1);
    }

    const timeLabel = deriveTimeOfDayLabel(catchRow);
    timeOfDayMap.set(timeLabel, (timeOfDayMap.get(timeLabel) || 0) + 1);

    const speciesLabel = deriveSpeciesLabel(catchRow);
    if (speciesLabel) {
      speciesMap.set(speciesLabel, (speciesMap.get(speciesLabel) || 0) + 1);
    }

    if (catchRow.weight) {
      const currentKg = toKg(catchRow.weight, catchRow.weight_unit);
      weightSumKg += currentKg;
      weightCount += 1;

      if (!pb) {
        pb = catchRow;
      } else {
        const pbKg = toKg(pb.weight, pb.weight_unit);
        if (currentKg > pbKg) {
          pb = catchRow;
        }
      }
    }

    const weatherRaw = getConditionValue(catchRow, "weather");
    if (weatherRaw) {
      const weatherLabel = formatLabel(weatherRaw);
      weatherMap.set(weatherLabel, (weatherMap.get(weatherLabel) || 0) + 1);
    }

    const clarityRaw = getConditionValue(catchRow, "waterClarity");
    if (clarityRaw) {
      const clarityLabel = formatLabel(clarityRaw);
      clarityMap.set(clarityLabel, (clarityMap.get(clarityLabel) || 0) + 1);
    }

    const windRaw = getConditionValue(catchRow, "windDirection");
    if (windRaw) {
      const windLabel = windRaw.length <= 4 ? windRaw.toUpperCase() : formatLabel(windRaw);
      windMap.set(windLabel, (windMap.get(windLabel) || 0) + 1);
    }

    const airTemp = getConditionNumber(catchRow, "airTemp");
    if (typeof airTemp === "number") {
      airTempSum += airTemp;
      airTempCount += 1;
    }
  });

  const mappedToArray = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  const pbCatch = pb
    ? {
        weight: pb.weight,
        unit: pb.weight_unit,
        label: pb.weight
          ? `${pb.weight} ${pb.weight_unit ? pb.weight_unit.toLowerCase() : ""}`.trim()
          : "No weight recorded",
      }
    : null;

  const sortedVenues = mappedToArray(venueMap);
  const sortedTime = mappedToArray(timeOfDayMap);
  const sortedBait = mappedToArray(baitMap).slice(0, 6);
  const sortedMethod = mappedToArray(methodMap).slice(0, 6);
  const sortedSpecies = mappedToArray(speciesMap);
  const sortedWeather = mappedToArray(weatherMap);
  const sortedClarity = mappedToArray(clarityMap);
  const sortedWind = mappedToArray(windMap);

  return {
    totalCatches: catches.length,
    pbCatch,
    topVenue: sortedVenues[0]?.name ?? null,
    topTimeOfDay: sortedTime[0]?.name ?? null,
    baitCounts: sortedBait,
    methodCounts: sortedMethod,
    timeOfDayCounts: sortedTime,
    speciesCounts: sortedSpecies,
    venueCounts: sortedVenues,
    weatherCounts: sortedWeather,
    clarityCounts: sortedClarity,
    windCounts: sortedWind,
    averageWeightKg: weightCount ? weightSumKg / weightCount : null,
    totalWeightKg: weightSumKg,
    averageAirTemp: airTempCount ? airTempSum / airTempCount : null,
    weightedCatchCount: weightCount,
  };
};
