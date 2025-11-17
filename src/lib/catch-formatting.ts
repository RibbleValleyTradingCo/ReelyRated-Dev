import { getFreshwaterSpeciesLabel } from "./freshwater-data";

interface Rating {
  rating: number;
}

export const calculateAverageRating = (ratings: Rating[]): string => {
  if (ratings.length === 0) return "No ratings yet";
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return `${(sum / ratings.length).toFixed(1)} / 10`;
};

export const formatWeight = (weight: number | null, unit: string | null): string | null => {
  if (!weight) return null;
  return `${weight}${unit === "kg" ? "kg" : "lb"}`;
};

export const formatSpecies = (species: string | null, custom?: string): string => {
  if (species === "other" && custom) {
    return custom;
  }
  return getFreshwaterSpeciesLabel(species);
};

export const formatEnum = (value: string | null): string => {
  if (!value) return "";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export const formatSlugLabel = (value: string | null | undefined): string => {
  if (!value) return "";
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};
