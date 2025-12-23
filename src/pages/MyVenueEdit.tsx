import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownEditor from "@/components/inputs/MarkdownEditor";
import InlineSpinner from "@/components/loading/InlineSpinner";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import OpeningHoursCard from "@/pages/venue-owner-admin/components/OpeningHoursCard";
import PricingTiersCard from "@/pages/venue-owner-admin/components/PricingTiersCard";
import RulesCard from "@/pages/my-venues/components/RulesCard";
import BookingCard from "@/pages/venue-owner-admin/components/BookingCard";
import VenuePhotosCard from "@/pages/venue-owner-admin/components/VenuePhotosCard";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";

type Venue = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  short_tagline: string | null;
  description: string | null;
  ticket_type: string | null;
  best_for_tags: string[] | null;
  facilities: string[] | null;
  price_from: string | null;
  website_url: string | null;
  booking_url: string | null;
  contact_phone: string | null;
  booking_enabled?: boolean | null;
};

type VenueEvent = {
  id: string;
  venue_id: string;
  title: string;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  ticket_info: string | null;
  website_url: string | null;
  booking_url: string | null;
  contact_phone: string | null;
  is_published: boolean;
};

const MyVenueEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [form, setForm] = useState({
    short_tagline: "",
    description: "",
    ticket_type: "",
    best_for_tags: "",
    facilities: "",
    price_from: "",
    website_url: "",
    booking_url: "",
    contact_phone: "",
  });
  const [eventForm, setEventForm] = useState({
    id: "" as string | "",
    title: "",
    event_type: "",
    starts_at: "",
    ends_at: "",
    description: "",
    ticket_info: "",
    website_url: "",
    booking_url: "",
    contact_phone: "",
    is_published: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    const loadVenue = async () => {
      if (!slug || !user) return;
      setIsLoading(true);
      const { data, error } = await supabase.rpc("get_venue_by_slug", { p_slug: slug });
      if (error) {
        console.error("Failed to load venue", error);
        toast.error("Unable to load venue");
        setVenue(null);
        setIsLoading(false);
        return;
      }
      const row = (data as Venue[] | null)?.[0] ?? null;
      setVenue(row);
      setForm({
        short_tagline: row?.short_tagline ?? "",
        description: row?.description ?? "",
        ticket_type: row?.ticket_type ?? "",
        best_for_tags: (row?.best_for_tags ?? []).join(", "),
        facilities: (row?.facilities ?? []).join(", "),
        price_from: row?.price_from ?? "",
        website_url: row?.website_url ?? "",
        booking_url: row?.booking_url ?? "",
        contact_phone: row?.contact_phone ?? "",
      });
      if (row?.id) {
        const { data: ownerRow } = await supabase
          .from("venue_owners")
          .select("venue_id")
          .eq("venue_id", row.id)
          .eq("user_id", user.id)
          .maybeSingle();
        const { data: adminRow } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
        setIsOwner(Boolean(ownerRow) || Boolean(adminRow));
      }
      setIsLoading(false);
    };
    void loadVenue();
  }, [slug, user]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!venue?.id || !isOwner) return;
      setEventsLoading(true);
      const { data, error } = await supabase.rpc("owner_get_venue_events", { p_venue_id: venue.id });
      if (error) {
        console.error("Failed to load events", error);
        toast.error("Unable to load events");
        setEvents([]);
      } else {
        type VenueEventRpc = Omit<VenueEvent, "contact_phone"> & { contact_phone?: string | null };
        const rows = (data ?? []) as unknown as VenueEventRpc[];
        setEvents(
          rows.map((row) => ({
            ...row,
            contact_phone: row.contact_phone ?? null,
          }))
        );
      }
      setEventsLoading(false);
    };
    void loadEvents();
  }, [isOwner, venue?.id]);

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!venue?.id) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("owner_update_venue_metadata", {
      p_venue_id: venue.id,
      p_tagline: form.short_tagline || null,
      p_description: form.description || null,
      p_ticket_type: form.ticket_type || null,
      p_best_for_tags: parseCsv(form.best_for_tags),
      p_facilities: parseCsv(form.facilities),
      p_price_from: form.price_from || null,
      p_website_url: form.website_url || null,
      p_booking_url: form.booking_url || null,
      p_contact_phone: form.contact_phone || null,
    });
    if (error) {
      console.error("Failed to update venue", error);
      toast.error("Failed to save changes");
    } else {
      toast.success("Venue updated");
      console.log("Updated venue from owner_update_venue_metadata", data);
    }
    setSaving(false);
  };

  const resetEventForm = () =>
    setEventForm({
      id: "",
      title: "",
      event_type: "",
      starts_at: "",
      ends_at: "",
      description: "",
      ticket_info: "",
      website_url: "",
      booking_url: "",
      contact_phone: "",
      is_published: false,
    });

  const handleEditEvent = (event?: VenueEvent) => {
    if (!event) {
      resetEventForm();
      return;
    }
    setEventForm({
      id: event.id,
      title: event.title ?? "",
      event_type: event.event_type ?? "",
      starts_at: event.starts_at ?? "",
      ends_at: event.ends_at ?? "",
      description: event.description ?? "",
      ticket_info: event.ticket_info ?? "",
      website_url: event.website_url ?? "",
      booking_url: event.booking_url ?? "",
      contact_phone: event.contact_phone ?? "",
      is_published: event.is_published ?? false,
    });
  };

  const handleSaveEvent = async () => {
    if (!venue?.id || !isOwner) return;
    setEventSaving(true);
    if (eventForm.id) {
      const { error } = await supabase.rpc("owner_update_venue_event", {
        p_event_id: eventForm.id,
        p_title: eventForm.title,
        p_event_type: eventForm.event_type || null,
        p_starts_at: eventForm.starts_at,
        p_ends_at: eventForm.ends_at || null,
        p_description: eventForm.description || null,
        p_ticket_info: eventForm.ticket_info || null,
        p_website_url: eventForm.website_url || null,
        p_booking_url: eventForm.booking_url || null,
        p_contact_phone: eventForm.contact_phone || null,
        p_is_published: eventForm.is_published,
      });
      if (error) {
        console.error("Failed to update event", error);
        toast.error("Failed to update event");
      } else {
        toast.success("Event updated");
      }
    } else {
      const { error } = await supabase.rpc("owner_create_venue_event", {
        p_venue_id: venue.id,
        p_title: eventForm.title,
        p_event_type: eventForm.event_type || null,
        p_starts_at: eventForm.starts_at,
        p_ends_at: eventForm.ends_at || null,
        p_description: eventForm.description || null,
        p_ticket_info: eventForm.ticket_info || null,
        p_website_url: eventForm.website_url || null,
        p_booking_url: eventForm.booking_url || null,
        p_contact_phone: eventForm.contact_phone || null,
        p_is_published: eventForm.is_published,
      });
      if (error) {
        console.error("Failed to create event", error);
        toast.error("Failed to create event");
      } else {
        toast.success("Event created");
      }
    }
    const { data: refreshed, error: refreshError } = await supabase.rpc("owner_get_venue_events", {
      p_venue_id: venue.id,
    });
    if (!refreshError) {
      type VenueEventRpc = Omit<VenueEvent, "contact_phone"> & { contact_phone?: string | null };
      const rows = (refreshed ?? []) as unknown as VenueEventRpc[];
      setEvents(
        rows.map((row) => ({
          ...row,
          contact_phone: row.contact_phone ?? null,
        }))
      );
    }
    resetEventForm();
    setEventSaving(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId || !isOwner) return;
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;
    const { error } = await supabase.rpc("owner_delete_venue_event", { p_event_id: eventId });
    if (error) {
      console.error("Failed to delete event", error);
      toast.error("Failed to delete event");
      return;
    }
    toast.success("Event deleted");
    const { data: refreshed } = await supabase.rpc("owner_get_venue_events", { p_venue_id: venue.id });
    type VenueEventRpc = Omit<VenueEvent, "contact_phone"> & { contact_phone?: string | null };
    const rows = (refreshed ?? []) as unknown as VenueEventRpc[];
    setEvents(
      rows.map((row) => ({
        ...row,
        contact_phone: row.contact_phone ?? null,
      }))
    );
    if (eventForm.id === eventId) {
      resetEventForm();
    }
  };

  const classifyEventStatus = (event: VenueEvent) => {
    if (!event.is_published) return "draft";
    const now = new Date();
    const starts = new Date(event.starts_at);
    return starts >= now ? "upcoming" : "past";
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center px-4 sm:px-6 py-16">
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <Text variant="muted">Loading venue…</Text>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isOwner || !venue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="px-4 sm:px-6 py-12">
          <Card className="w-full border-border/70">
            <CardHeader>
              <Heading as="h2" size="md" className="text-foreground">
                Access denied
              </Heading>
            </CardHeader>
            <CardContent className="space-y-2">
              <Text variant="muted" className="text-sm">
                You do not have permission to manage this venue.
              </Text>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/venues">Back to venues</Link>
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-5xl py-8 md:py-10">
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={<Eyebrow className="text-muted-foreground">Owner</Eyebrow>}
              title="Manage venue"
              subtitle={venue.name}
              actions={
                <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button variant="ghost" asChild className="w-full sm:w-auto">
                    <Link to={`/venues/${venue.slug}`}>View public page</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link to="/my/venues">Back to my venues</Link>
                  </Button>
                </div>
              }
            />
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="md" className="text-foreground">
                  Venue details
                </Heading>
                <Text variant="muted" className="text-sm">
                  Update your venue&apos;s public information.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 min-w-0">
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Short tagline</label>
                    <Input
                      value={form.short_tagline}
                      onChange={(e) => setForm((prev) => ({ ...prev, short_tagline: e.target.value }))}
                      placeholder="Big carp day-ticket venue with 3 main lakes"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 min-w-0">
                    <MarkdownEditor
                      id="venueDescription"
                      label="Description"
                      value={form.description}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, description: value }))
                      }
                      rows={4}
                      placeholder="Brief description of the venue"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Ticket type</label>
                    <Input
                      value={form.ticket_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, ticket_type: e.target.value }))}
                      placeholder="Day ticket fishery, Syndicate, Club water"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Best for tags (comma separated)</label>
                    <Input
                      value={form.best_for_tags}
                      onChange={(e) => setForm((prev) => ({ ...prev, best_for_tags: e.target.value }))}
                      placeholder="Carp, Match, Families"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Facilities (comma separated)</label>
                    <Input
                      value={form.facilities}
                      onChange={(e) => setForm((prev) => ({ ...prev, facilities: e.target.value }))}
                      placeholder="Toilets, Café, Tackle shop"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Price from</label>
                    <Input
                      value={form.price_from}
                      onChange={(e) => setForm((prev) => ({ ...prev, price_from: e.target.value }))}
                      placeholder="from £10 / day"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Website URL</label>
                    <Input
                      value={form.website_url}
                      onChange={(e) => setForm((prev) => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Booking URL</label>
                    <Input
                      value={form.booking_url}
                      onChange={(e) => setForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                      placeholder="https://example.com/book"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-foreground">Contact phone</label>
                    <Input
                      value={form.contact_phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+44 1234 567890"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
                  <Button onClick={() => void handleSave()} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <InlineSpinner label="Saving…" className="text-current" /> : "Save changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section>
            <OpeningHoursCard venueId={venue.id} />
          </Section>

          <Section>
            <PricingTiersCard venueId={venue.id} />
          </Section>

          <Section>
            <RulesCard venueId={venue.id} venueName={venue.name} />
          </Section>

          <Section>
            <BookingCard
              venueId={venue.id}
              initialEnabled={venue.booking_enabled ?? true}
              onUpdated={(nextValue) =>
                setVenue((current) => (current ? { ...current, booking_enabled: nextValue } : current))
              }
            />
          </Section>

          <Section>
            <VenuePhotosCard venueId={venue.id} />
          </Section>

          <Section>
            <Card className="w-full border-border/70">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="md" className="text-foreground">
                  Events
                </Heading>
                <Text variant="muted" className="text-sm">
                  Manage and publish events for this venue.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {eventsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading events…
                    </div>
                  ) : events.length === 0 ? (
                    <Text variant="muted" className="text-sm">
                      No events yet.
                    </Text>
                  ) : (
                    events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded border border-border/60 bg-card/60 p-3 space-y-2 min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2 text-sm font-semibold min-w-0">
                          <span className="truncate">{event.title}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              classifyEventStatus(event) === "draft"
                                ? "bg-amber-50 text-amber-700"
                                : classifyEventStatus(event) === "upcoming"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {classifyEventStatus(event)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {event.starts_at ? new Date(event.starts_at).toLocaleString() : "No start date"}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)} className="w-full sm:w-auto">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleDeleteEvent(event.id)}
                            className="w-full sm:w-auto"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 rounded border border-border/60 bg-muted/30 p-4">
                  <Heading as="h3" size="sm" className="text-foreground">
                    {eventForm.id ? "Edit event" : "Create event"}
                  </Heading>
                  <div className="grid gap-3 md:grid-cols-2 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Title</label>
                      <Input
                        value={eventForm.title}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Event type</label>
                      <Input
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, event_type: e.target.value }))}
                        placeholder="match, open_day, announcement…"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Starts at</label>
                      <Input
                        type="datetime-local"
                        value={eventForm.starts_at}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Ends at</label>
                      <Input
                        type="datetime-local"
                        value={eventForm.ends_at}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Ticket info</label>
                      <Input
                        value={eventForm.ticket_info}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, ticket_info: e.target.value }))}
                        placeholder="£25, 30 pegs, payout to top 3"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Website URL</label>
                      <Input
                        value={eventForm.website_url}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, website_url: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Booking URL</label>
                      <Input
                        value={eventForm.booking_url}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground">Contact phone</label>
                      <Input
                        value={eventForm.contact_phone}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded bg-white/40 px-3 py-2">
                      <input
                        id="isPublished"
                        type="checkbox"
                        checked={eventForm.is_published}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                      />
                      <label htmlFor="isPublished" className="text-xs text-muted-foreground">
                        Published
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    <Button onClick={() => void handleSaveEvent()} disabled={eventSaving} className="w-full sm:w-auto">
                      {eventSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save event"
                      )}
                    </Button>
                    {eventForm.id && (
                      <Button variant="outline" onClick={() => resetEventForm()} className="w-full sm:w-auto">
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default MyVenueEdit;
