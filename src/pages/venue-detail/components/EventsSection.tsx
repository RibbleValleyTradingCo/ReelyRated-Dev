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
        titleClassName="text-3xl font-bold text-gray-900 md:text-4xl"
        className="px-0 mb-6"
        actions={
          pastEvents.length > 0 ? (
            <button
              type="button"
              onClick={onTogglePastEvents}
              className="text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
            >
              {showPastEvents ? "Hide past events" : "Show past events"}
            </button>
          ) : null
        }
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Upcoming
          </h3>
          {eventsLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-blue-100 bg-white/90 p-5 text-slate-500 shadow-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading events…
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/90 p-5 text-sm text-slate-600 shadow-sm">
              No upcoming events — check back soon.
            </div>
          ) : (
            <>
              {featuredEvent ? (
                <Card className="rounded-2xl border border-blue-200 bg-white shadow-md transition hover:shadow-lg">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-lg font-semibold text-slate-900 break-words">
                          {featuredEvent.title}
                        </p>
                        <p className="text-sm font-medium text-slate-600">
                          {formatEventDate(
                            featuredEvent.starts_at,
                            featuredEvent.ends_at
                          )}
                        </p>
                      </div>
                      {featuredEvent.event_type ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800">
                          {featuredEvent.event_type}
                        </span>
                      ) : null}
                    </div>
                    {featuredEvent.description ? (
                      <p className="text-sm text-slate-600 line-clamp-3 break-words">
                        {featuredEvent.description}
                      </p>
                    ) : null}
                    {featuredEvent.ticket_info ? (
                      <p className="text-xs font-semibold text-slate-700 break-words">
                        Tickets: {featuredEvent.ticket_info}
                      </p>
                    ) : null}
                    <div>
                      {featuredLink ? (
                        <a
                          href={featuredLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
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
                        className="rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <CardContent className="space-y-2 p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <p className="text-base font-semibold text-slate-900 break-words">
                                {event.title}
                              </p>
                              <p className="text-sm font-medium text-slate-600">
                                {formatEventDate(event.starts_at, event.ends_at)}
                              </p>
                            </div>
                            {event.event_type ? (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800">
                                {event.event_type}
                              </span>
                            ) : null}
                          </div>
                          {event.description ? (
                            <p className="text-sm text-slate-600 line-clamp-3 break-words">
                              {event.description}
                            </p>
                          ) : null}
                          {event.ticket_info ? (
                            <p className="text-xs font-semibold text-slate-700 break-words">
                              Tickets: {event.ticket_info}
                            </p>
                          ) : null}
                          <div>
                            {eventLink ? (
                              <a
                                href={eventLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
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
          <div className="space-y-3 border-t border-blue-100/80 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Past events
            </h3>
            {pastEventsLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-blue-100 bg-white/90 p-5 text-slate-500 shadow-sm">
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
                      className="rounded-2xl border border-blue-100/70 bg-white/80 shadow-sm transition hover:shadow-md"
                    >
                      <CardContent className="space-y-2 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <p className="text-base font-semibold text-slate-800 break-words">
                              {event.title}
                            </p>
                            <p className="text-sm font-medium text-slate-500">
                              {formatEventDate(event.starts_at, event.ends_at)}
                            </p>
                          </div>
                          {event.event_type ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800">
                              {event.event_type}
                            </span>
                          ) : null}
                        </div>
                        {event.description ? (
                          <p className="text-sm text-slate-500 line-clamp-3 break-words">
                            {event.description}
                          </p>
                        ) : null}
                        {event.ticket_info ? (
                          <p className="text-xs font-semibold text-slate-500 break-words">
                            Tickets: {event.ticket_info}
                          </p>
                        ) : null}
                        <div>
                          {eventLink ? (
                            <a
                              href={eventLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
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
