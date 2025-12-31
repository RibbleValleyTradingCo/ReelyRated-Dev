import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, MapPin, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface VenueCount {
  name: string;
  count: number;
}

interface SessionSummary {
  id: string;
  count: number;
  label: string;
  dateLabel: string | null;
}

interface InfoCardsProps {
  topTimeOfDay: string | null;
  topWeather: string | null;
  topClarity: string | null;
  topWind: string | null;
  averageAirTempLabel: string;
  venueLeaderboard: VenueCount[];
  sessionsCount: number;
  averagePerSessionLabel: string;
  sessionSummaries: SessionSummary[];
  topSession: SessionSummary | null;
  topVenueHighlight?: string | null;
  sections?: Array<"conditions" | "venues" | "sessions">;
  className?: string;
}

export const InfoCards = memo(({
  topTimeOfDay,
  topWeather,
  topClarity,
  topWind,
  averageAirTempLabel,
  venueLeaderboard,
  sessionsCount,
  averagePerSessionLabel,
  sessionSummaries,
  topSession,
  topVenueHighlight,
  sections,
  className,
}: InfoCardsProps) => {
  const activeSections = sections && sections.length > 0
    ? sections
    : ["conditions", "venues", "sessions"];
  const showConditions = activeSections.includes("conditions");
  const showVenues = activeSections.includes("venues");
  const showSessions = activeSections.includes("sessions");

  const cards: JSX.Element[] = [];

  if (showConditions) {
    cards.push(
      <Card key="conditions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CloudSun className="h-4 w-4 text-primary" />
            Conditions snapshot
          </CardTitle>
          <p className="text-sm text-muted-foreground">What the weather says about your fishing.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prime time</span>
              <span className="font-medium text-foreground">{topTimeOfDay ?? "—"}</span>
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
        </CardContent>
      </Card>
    );
  }

  if (showVenues) {
    cards.push(
      <Card key="venues">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Venue leaderboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">Where you're finding the most success.</p>
        </CardHeader>
        <CardContent>
          {venueLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No venue data yet.
            </p>
          ) : (
            <>
              {topVenueHighlight ? (
                <p className="mb-3 text-sm font-medium text-foreground">{topVenueHighlight}</p>
              ) : null}
              <ol className="space-y-2 text-sm">
                {venueLeaderboard.map((venue, index) => (
                  <li key={venue.name} className="flex items-center justify-between gap-4">
                    <span className="font-medium text-foreground">
                      {index + 1}. {venue.name}
                    </span>
                    <span className="text-muted-foreground">
                      {venue.count} catch{venue.count === 1 ? "" : "es"}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (showSessions) {
    cards.push(
      <Card key="sessions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            Session highlights
          </CardTitle>
          <p className="text-sm text-muted-foreground">How your logged trips stack up.</p>
        </CardHeader>
        <CardContent>
          {sessionsCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions recorded for these filters yet.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total sessions</span>
                <span className="font-medium text-foreground">{sessionsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg catches per session</span>
                <span className="font-medium text-foreground">{averagePerSessionLabel}</span>
              </div>
              {topSession && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Top session</p>
                  <p className="text-sm font-semibold text-foreground">{topSession.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {topSession.dateLabel ? `${topSession.dateLabel} · ` : ""}
                    {topSession.count} catch{topSession.count === 1 ? "" : "es"}
                  </p>
                </div>
              )}
              {sessionSummaries.length > (topSession ? 1 : 0) && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Other stand-out trips</p>
                  <ul className="space-y-1">
                    {(topSession ? sessionSummaries.slice(1) : sessionSummaries).map((session) => (
                      <li key={session.id} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{session.label}</span>
                        <span>{session.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const columnClass =
    cards.length === 1 ? "lg:grid-cols-1" : cards.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <div className={cn("grid grid-cols-1 gap-6", columnClass, className)}>
      {cards}
    </div>
  );
});

InfoCards.displayName = "InfoCards";
