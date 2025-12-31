import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeExternalUrl } from "@/lib/urls";
import type { VenueEvent } from "@/pages/venue-detail/types";
import { formatEventDate } from "@/pages/venue-detail/utils";
import { Loader2 } from "lucide-react";

type EventsSectionProps = {
  upcomingEvents: VenueEvent[];
  pastEvents: VenueEvent[];
  eventsLoading: boolean;
  pastEventsLoading: boolean;
  pastHasMore: boolean;
  showPastEvents: boolean;
  onTogglePastEvents: () => void;
  onLoadPastEvents: () => void;
};

const resolveEventLink = (event: VenueEvent) => {
  const bookingUrl = normalizeExternalUrl(event.booking_url);
  if (bookingUrl) return { url: bookingUrl, label: "Book now" };
  const websiteUrl = normalizeExternalUrl(event.website_url);
  if (websiteUrl) return { url: websiteUrl, label: "More details" };
  return null;
};

const EventsSection = ({
  upcomingEvents,
  pastEvents,
  eventsLoading,
  pastEventsLoading,
  pastHasMore,
  showPastEvents,
  onTogglePastEvents,
  onLoadPastEvents,
}: EventsSectionProps) => {
  const featuredEvent = upcomingEvents[0];
  const featuredLink = featuredEvent ? resolveEventLink(featuredEvent) : null;
  return upcomingEvents.length > 0 || pastEvents.length > 0 ? (
    <Section className="space-y-6">
      <SectionHeader
        title="Events & Announcements"
        subtitle="Match dates, announcements, and venue updates."
        titleClassName="text-3xl font-bold text-foreground md:text-4xl"
        className="px-0 mb-6"
        actions={
          pastEvents.length > 0 ? (
            <button
              type="button"
              onClick={onTogglePastEvents}
              className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {showPastEvents ? "Hide past events" : "Show past events"}
            </button>
          ) : null
        }
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming
          </h3>
          {eventsLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card/90 p-5 text-muted-foreground shadow-card">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading events…
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-5 text-sm text-muted-foreground shadow-none">
              No upcoming events — check back soon.
            </div>
          ) : (
            <>
              {featuredEvent ? (
                <Card className="rounded-2xl border border-border bg-card shadow-card transition hover:shadow-card-hover">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-lg font-semibold text-foreground break-words">
                          {featuredEvent.title}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {formatEventDate(
                            featuredEvent.starts_at,
                            featuredEvent.ends_at
                          )}
                        </p>
                      </div>
                      {featuredEvent.event_type ? (
                        <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-semibold text-secondary">
                          {featuredEvent.event_type}
                        </span>
                      ) : null}
                    </div>
                    {featuredEvent.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                        {featuredEvent.description}
                      </p>
                    ) : null}
                    {featuredEvent.ticket_info ? (
                      <p className="text-xs font-semibold text-muted-foreground break-words">
                        Tickets: {featuredEvent.ticket_info}
                      </p>
                    ) : null}
                    <div>
                      {featuredLink ? (
                        <a
                          href={featuredLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {featuredLink.label}
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              {upcomingEvents.length > 1 ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(1).map((event) => {
                    const eventLink = resolveEventLink(event);
                    return (
                      <Card
                        key={event.id}
                        className="rounded-2xl border border-border bg-card shadow-card transition hover:shadow-card-hover"
                      >
                        <CardContent className="space-y-2 p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <p className="text-base font-semibold text-foreground break-words">
                                {event.title}
                              </p>
                              <p className="text-sm font-medium text-muted-foreground">
                                {formatEventDate(event.starts_at, event.ends_at)}
                              </p>
                            </div>
                            {event.event_type ? (
                              <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-semibold text-secondary">
                                {event.event_type}
                              </span>
                            ) : null}
                          </div>
                          {event.description ? (
                            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                              {event.description}
                            </p>
                          ) : null}
                          {event.ticket_info ? (
                            <p className="text-xs font-semibold text-muted-foreground break-words">
                              Tickets: {event.ticket_info}
                            </p>
                          ) : null}
                          <div>
                            {eventLink ? (
                              <a
                                href={eventLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                              >
                                {eventLink.label}
                              </a>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : null}
            </>
          )}
        </div>

        {pastEvents.length > 0 && showPastEvents ? (
          <div className="space-y-3 border-t border-border/60 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Past events
            </h3>
            {pastEventsLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-border bg-card/90 p-5 text-muted-foreground shadow-card">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading past events…
              </div>
            ) : (
              <div className="space-y-3">
                {pastEvents.map((event) => {
                  const eventLink = resolveEventLink(event);
                  return (
                    <Card
                      key={event.id}
                      className="rounded-2xl border border-border/80 bg-card/80 shadow-card transition hover:shadow-card-hover"
                    >
                      <CardContent className="space-y-2 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <p className="text-base font-semibold text-foreground break-words">
                              {event.title}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                              {formatEventDate(event.starts_at, event.ends_at)}
                            </p>
                          </div>
                          {event.event_type ? (
                            <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-semibold text-secondary">
                              {event.event_type}
                            </span>
                          ) : null}
                        </div>
                        {event.description ? (
                          <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                            {event.description}
                          </p>
                        ) : null}
                        {event.ticket_info ? (
                          <p className="text-xs font-semibold text-muted-foreground break-words">
                            Tickets: {event.ticket_info}
                          </p>
                        ) : null}
                        <div>
                          {eventLink ? (
                            <a
                              href={eventLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              {eventLink.label}
                            </a>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {pastHasMore ? (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4"
                      disabled={pastEventsLoading}
                      onClick={onLoadPastEvents}
                    >
                      {pastEventsLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading…
                        </>
                      ) : (
                        "Load more past events"
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Section>
  ) : null;
};

export default EventsSection;
