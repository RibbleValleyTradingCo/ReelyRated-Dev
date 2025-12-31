import { getFreshwaterSpeciesLabel } from "@/lib/freshwater-data";

export const formatLeaderboardSpeciesLabel = (species: string | null, custom?: string | null) => {
  if (custom) return custom;
  if (!species) return "Unknown";
  if (species === "other") return "Other";
  return getFreshwaterSpeciesLabel(species) ?? species.replace(/_/g, " ");
};
