import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UK_FRESHWATER_SPECIES } from "@/lib/freshwater-data";

const capitalizeFirstWord = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

interface FeedFiltersProps {
  feedScope: "all" | "following";
  onFeedScopeChange: (scope: "all" | "following") => void;
  speciesFilter: string;
  onSpeciesFilterChange: (filter: string) => void;
  customSpeciesFilter: string;
  onCustomSpeciesFilterChange: (filter: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  userDisabled: boolean;
}

export const FeedFilters = ({
  feedScope,
  onFeedScopeChange,
  speciesFilter,
  onSpeciesFilterChange,
  customSpeciesFilter,
  onCustomSpeciesFilterChange,
  sortBy,
  onSortByChange,
  userDisabled,
}: FeedFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8 justify-center">
      <Select
        value={feedScope}
        onValueChange={onFeedScopeChange}
        disabled={userDisabled}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Feed scope" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All catches</SelectItem>
          <SelectItem value="following">People you follow</SelectItem>
        </SelectContent>
      </Select>

      <Select value={speciesFilter} onValueChange={onSpeciesFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by species" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Species</SelectItem>
          {UK_FRESHWATER_SPECIES.map((species) => (
            <SelectItem key={species.value} value={species.value}>
              {species.label}
            </SelectItem>
          ))}
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      {speciesFilter === "other" && (
        <Input
          className="w-[220px]"
          placeholder="Describe species"
          aria-label="Custom species filter"
          value={customSpeciesFilter}
          onChange={(e) => onCustomSpeciesFilterChange(capitalizeFirstWord(e.target.value))}
        />
      )}

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="highest_rated">Highest Rated</SelectItem>
          <SelectItem value="heaviest">Heaviest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
