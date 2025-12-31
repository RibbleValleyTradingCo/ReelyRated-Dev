import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Trophy, Scale, Layers, Sparkles } from "lucide-react";

interface StatsCardsProps {
  totalCatches: number;
  pbLabel: string;
  averageWeightLabel: string;
  weightedCatchCount: number;
  sessionsCount: number;
  averagePerSessionLabel: string;
  mostCommonSpecies: string | null;
  mostCommonSpeciesCount: number;
}

export const StatsCards = memo(({
  totalCatches,
  pbLabel,
  averageWeightLabel,
  weightedCatchCount,
  sessionsCount,
  averagePerSessionLabel,
  mostCommonSpecies,
  mostCommonSpeciesCount,
}: StatsCardsProps) => {
  const valueClass = "text-2xl font-semibold leading-tight tracking-tight text-foreground tabular-nums sm:text-3xl";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total catches</CardTitle>
          <Fish className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className={valueClass}>{totalCatches}</p>
          <p className="text-xs text-muted-foreground">Logged with these filters</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Personal best</CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className={`${valueClass} break-words`}>{pbLabel}</p>
          <p className="text-xs text-muted-foreground">Heaviest catch in this range</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Average weight</CardTitle>
          <Scale className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className={`${valueClass} break-words`}>{averageWeightLabel}</p>
          <p className="text-xs text-muted-foreground">
            {weightedCatchCount > 0
              ? `Across ${weightedCatchCount} weighed catch${weightedCatchCount === 1 ? "" : "es"}`
              : "No weights recorded in this view"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sessions in range</CardTitle>
          <Layers className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className={valueClass}>{sessionsCount}</p>
          <p className="text-xs text-muted-foreground">
            {sessionsCount === 0
              ? "No sessions tagged"
              : `Avg ${averagePerSessionLabel} catches per session`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Most common species</CardTitle>
          <Sparkles className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className={`${valueClass} break-words`}>
            {mostCommonSpecies ?? "No species data yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {mostCommonSpecies
              ? `Seen ${mostCommonSpeciesCount} time${mostCommonSpeciesCount === 1 ? "" : "s"}`
              : "Log more catches to surface your go-to species."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

StatsCards.displayName = "StatsCards";
