import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownEditor from "@/components/inputs/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";
import BookingCard from "@/pages/venue-owner-admin/components/BookingCard";
import OpeningHoursCard from "@/pages/venue-owner-admin/components/OpeningHoursCard";
import PricingTiersCard from "@/pages/venue-owner-admin/components/PricingTiersCard";
import RulesCard from "@/pages/my-venues/components/RulesCard";
import VenuePhotosCard from "@/pages/venue-owner-admin/components/VenuePhotosCard";

type Venue = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  description: string | null;
  short_tagline: string | null;
  ticket_type: string | null;
  price_from: string | null;
  best_for_tags: string[] | null;
  facilities: string[] | null;
  website_url: string | null;
  booking_url: string | null;
  contact_phone: string | null;
  notes_for_rr_team: string | null;
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
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

const AdminVenueEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState({
    short_tagline: "",
    description: "",
    ticket_type: "",
    price_from: "",
    best_for_tags: "",
    facilities: "",
    website_url: "",
    booking_url: "",
    contact_phone: "",
    notes_for_rr_team: "",
  });
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
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
    is_published: false,
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [owners, setOwners] = useState<{ user_id: string; username: string | null; role: string }[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerSaving, setOwnerSaving] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        toast.error("You must be an admin to view this page.");
        navigate("/");
        return;
      }
      const adminStatus = await isAdminUser(user.id);
      if (!adminStatus) {
        toast.error("You must be an admin to view this page.");
        navigate("/");
      } else {
        setIsAdmin(true);
      }
    };
    void checkAdmin();
  }, [navigate, user]);

  useEffect(() => {
    const loadVenue = async () => {
      if (!slug) return;
      setLoading(true);
      const { data, error } = await supabase.rpc("get_venue_by_slug", { p_slug: slug });
      if (error) {
        console.error("Failed to load venue", error);
        toast.error("Failed to load venue");
        setVenue(null);
        setLoading(false);
        return;
      }
      const row = (data as Venue[] | null)?.[0] ?? null;
      setVenue(row);
      setForm({
        short_tagline: row?.short_tagline ?? "",
        description: row?.description ?? "",
        ticket_type: row?.ticket_type ?? "",
        price_from: row?.price_from ?? "",
        best_for_tags: (row?.best_for_tags ?? []).join(", "),
        facilities: (row?.facilities ?? []).join(", "),
        website_url: row?.website_url ?? "",
        booking_url: row?.booking_url ?? "",
        contact_phone: row?.contact_phone ?? "",
        notes_for_rr_team: row?.notes_for_rr_team ?? "",
      });
      setLoading(false);
    };
    void loadVenue();
  }, [slug]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!venue?.id) return;
      setEventsLoading(true);
      const { data, error } = await supabase.rpc("admin_get_venue_events", {
        p_venue_id: venue.id,
      });
      if (error) {
        console.error("Failed to load events", error);
        toast.error("Failed to load events");
        setEvents([]);
      } else {
        setEvents((data as VenueEvent[]) ?? []);
      }
      setEventsLoading(false);
    };
    void loadEvents();
  }, [venue?.id]);

  useEffect(() => {
    const loadOwners = async () => {
      if (!venue?.id) return;
      setOwnersLoading(true);
      const { data, error } = await supabase
        .from("venue_owners")
        .select("user_id, role, profiles:user_id (username)")
        .eq("venue_id", venue.id);
      if (error) {
        console.error("Failed to load owners", error);
        toast.error("Failed to load venue owners");
        setOwners([]);
      } else {
        type OwnerRow = {
          user_id: string;
          role: string | null;
          profiles: { username: string | null } | null;
        };
        const rows = (data ?? []) as unknown as OwnerRow[];
        setOwners(
          rows.map((row) => ({
            user_id: row.user_id,
            username: row.profiles?.username ?? null,
            role: row.role ?? "owner",
          }))
        );
      }
      setOwnersLoading(false);
    };
    void loadOwners();
  }, [venue?.id]);

  const parseCsv = (value: string | undefined | null) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!venue?.id) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("admin_update_venue_metadata", {
      p_venue_id: venue.id,
      p_short_tagline: form.short_tagline || null,
      p_description: form.description || null,
      p_ticket_type: form.ticket_type || null,
      p_price_from: form.price_from || null,
      p_best_for_tags: parseCsv(form.best_for_tags),
      p_facilities: parseCsv(form.facilities),
      p_website_url: form.website_url || null,
      p_booking_url: form.booking_url || null,
      p_contact_phone: form.contact_phone || null,
      p_notes_for_rr_team: form.notes_for_rr_team || null,
    });
    if (error) {
      console.error("Failed to update venue", error);
      toast.error("Failed to save changes");
    } else {
      toast.success("Venue updated");
      console.log("Admin updated venue metadata, returned:", data);
      // refresh
      const { data: refreshed } = await supabase.rpc("get_venue_by_slug", { p_slug: slug });
      const row = (refreshed as Venue[] | null)?.[0] ?? null;
      setVenue(row);
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
      is_published: false,
    });

  const resolveOwnerUser = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .or(`id.eq.${trimmed},username.eq.${trimmed}`)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return data.id as string;
  };

  const handleAddOwner = async () => {
    if (!venue?.id) return;
    const userId = await resolveOwnerUser(ownerInput);
    if (!userId) {
      toast.error("User not found. Enter a valid username or user ID.");
      return;
    }
    setOwnerSaving(true);
    const { error } = await supabase.rpc("admin_add_venue_owner", {
      p_venue_id: venue.id,
      p_user_id: userId,
      p_role: "owner",
    });
    if (error) {
      console.error("Failed to add owner", error);
      toast.error("Unable to add owner");
    } else {
      toast.success("Owner added");
      setOwnerInput("");
      const { data } = await supabase
        .from("venue_owners")
        .select("user_id, role, profiles:user_id (username)")
        .eq("venue_id", venue.id);
      type OwnerRow = {
        user_id: string;
        role: string | null;
        profiles: { username: string | null } | null;
      };
      const rows = (data ?? []) as unknown as OwnerRow[];
      setOwners(
        rows.map((row) => ({
          user_id: row.user_id,
          username: row.profiles?.username ?? null,
          role: row.role ?? "owner",
        }))
      );
    }
    setOwnerSaving(false);
  };

  const handleRemoveOwner = async (userId: string) => {
    if (!venue?.id) return;
    if (!window.confirm("Remove this owner?")) return;
    const { error } = await supabase.rpc("admin_remove_venue_owner", {
      p_venue_id: venue.id,
      p_user_id: userId,
    });
    if (error) {
      console.error("Failed to remove owner", error);
      toast.error("Unable to remove owner");
    } else {
      toast.success("Owner removed");
      setOwners((prev) => prev.filter((o) => o.user_id !== userId));
    }
  };

  const handleEditEvent = (event?: VenueEvent) => {
    if (!event) {
      resetEventForm();
      return;
    }
    setEventForm({
      id: event.id,
      title: event.title,
      event_type: event.event_type ?? "",
      starts_at: event.starts_at,
      ends_at: event.ends_at ?? "",
      description: event.description ?? "",
      ticket_info: event.ticket_info ?? "",
      website_url: event.website_url ?? "",
      booking_url: event.booking_url ?? "",
      is_published: event.is_published,
    });
  };

  const handleSaveEvent = async () => {
    if (!venue?.id) return;
    if (!eventForm.title || !eventForm.starts_at) {
      toast.error("Title and start date/time are required");
      return;
    }
    setEventSaving(true);
    if (eventForm.id) {
      const { error } = await supabase.rpc("admin_update_venue_event", {
        p_event_id: eventForm.id,
        p_venue_id: venue.id,
        p_title: eventForm.title,
        p_event_type: eventForm.event_type || null,
        p_starts_at: eventForm.starts_at,
        p_ends_at: eventForm.ends_at || null,
        p_description: eventForm.description || null,
        p_ticket_info: eventForm.ticket_info || null,
        p_website_url: eventForm.website_url || null,
        p_booking_url: eventForm.booking_url || null,
        p_is_published: eventForm.is_published,
      });
      if (error) {
        console.error("Failed to update event", error);
        toast.error("Failed to update event");
      } else {
        toast.success("Event updated");
      }
    } else {
      const { error } = await supabase.rpc("admin_create_venue_event", {
        p_venue_id: venue.id,
        p_title: eventForm.title,
        p_event_type: eventForm.event_type || null,
        p_starts_at: eventForm.starts_at,
        p_ends_at: eventForm.ends_at || null,
        p_description: eventForm.description || null,
        p_ticket_info: eventForm.ticket_info || null,
        p_website_url: eventForm.website_url || null,
        p_booking_url: eventForm.booking_url || null,
        p_is_published: eventForm.is_published,
      });
      if (error) {
        console.error("Failed to create event", error);
        toast.error("Failed to create event");
      } else {
        toast.success("Event created");
      }
    }
    const { data: refreshed, error: refreshError } = await supabase.rpc("get_venue_upcoming_events", {
      p_venue_id: venue.id,
    });
    if (!refreshError) {
      setEvents((refreshed as VenueEvent[]) ?? []);
    }
    resetEventForm();
    setEventSaving(false);
  };

  const classifyEventStatus = (event: VenueEvent) => {
    if (!event.is_published) return "draft";
    const now = new Date();
    const starts = new Date(event.starts_at);
    return starts >= now ? "upcoming" : "past";
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) return;
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;
    const { error } = await supabase.rpc("admin_delete_venue_event", { p_event_id: eventId });
    if (error) {
      console.error("Failed to delete event", error);
      toast.error("Failed to delete event");
      return;
    }
    toast.success("Event deleted");
    if (venue?.id) {
      const { data: refreshed } = await supabase.rpc("admin_get_venue_events", { p_venue_id: venue.id });
      setEvents((refreshed as VenueEvent[]) ?? []);
    }
    if (eventForm.id === eventId) {
      resetEventForm();
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center px-4 sm:px-6 py-16 overflow-x-hidden">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-500" />
          <Text variant="muted">Loading venue…</Text>
        </PageContainer>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="px-4 sm:px-6 py-12 overflow-x-hidden">
          <Card className="border border-slate-200 bg-white shadow-sm w-full">
            <CardHeader>
              <Heading as="h2" size="md" className="text-foreground">
                Venue not found
              </Heading>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text variant="muted" className="text-sm">
                This venue doesn&apos;t exist or isn&apos;t published.
              </Text>
              <Button asChild variant="outline">
                <Link to="/admin/venues">Back to admin venues</Link>
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-6xl py-8 md:py-10 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Eyebrow className="text-muted-foreground">Admin</Eyebrow>
                </div>
              }
              title={venue.name || "Edit venue"}
              subtitle="Manage venue metadata, owners, and events."
              actions={
                <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="ghost" asChild className="rounded-full w-full sm:w-auto">
                    <Link to={`/venues/${venue.slug}`}>View public page</Link>
                  </Button>
                  <Button variant="outline" asChild className="rounded-full w-full sm:w-auto">
                    <Link to="/admin/venues">Back to list</Link>
                  </Button>
                </div>
              }
            />
          </Section>

          <Section>
            <Card className="border border-slate-200 bg-white shadow-sm w-full">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="md" className="text-foreground">
                  Metadata
                </Heading>
                <Text variant="muted" className="text-sm">
                  Update public details and internal notes for this venue.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 min-w-0">
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Short tagline</label>
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
                    <label className="text-sm font-semibold text-slate-800">Ticket type</label>
                    <Input
                      value={form.ticket_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, ticket_type: e.target.value }))}
                      placeholder="Day ticket, Syndicate, Club water, Coaching venue"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Price from</label>
                    <Input
                      value={form.price_from}
                      onChange={(e) => setForm((prev) => ({ ...prev, price_from: e.target.value }))}
                      placeholder="from £10 / day"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Best for tags (comma separated)</label>
                    <Input
                      value={form.best_for_tags}
                      onChange={(e) => setForm((prev) => ({ ...prev, best_for_tags: e.target.value }))}
                      placeholder="Carp, Match, Families"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Facilities (comma separated)</label>
                    <Input
                      value={form.facilities}
                      onChange={(e) => setForm((prev) => ({ ...prev, facilities: e.target.value }))}
                      placeholder="Toilets, Café, Tackle shop"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Website URL</label>
                    <Input
                      value={form.website_url}
                      onChange={(e) => setForm((prev) => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Booking URL</label>
                    <Input
                      value={form.booking_url}
                      onChange={(e) => setForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                      placeholder="https://example.com/book"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-semibold text-slate-800">Contact phone</label>
                    <Input
                      value={form.contact_phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+44 ..."
                    />
                  </div>
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-semibold text-slate-800">Internal notes (RR team only)</label>
                  <Textarea
                    value={form.notes_for_rr_team}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes_for_rr_team: e.target.value }))}
                    placeholder="Internal notes not shown publicly"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full w-full sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section>
            <BookingCard
              venueId={venue.id}
              initialEnabled={venue.booking_enabled ?? true}
              mode="admin"
              onUpdated={(nextValue) =>
                setVenue((current) => (current ? { ...current, booking_enabled: nextValue } : current))
              }
            />
          </Section>

          <Section>
            <OpeningHoursCard venueId={venue.id} mode="admin" />
          </Section>

          <Section>
            <PricingTiersCard venueId={venue.id} mode="admin" />
          </Section>

          <Section>
            <RulesCard venueId={venue.id} venueName={venue.name} mode="admin" />
          </Section>

          <Section>
            <VenuePhotosCard venueId={venue.id} />
          </Section>

          <Section>
            <Card className="border border-slate-200 bg-white shadow-sm w-full">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="md" className="text-foreground">
                  Owners
                </Heading>
                <Text variant="muted" className="text-sm">
                  Assign venue owners/managers who can self-manage metadata and events for this venue.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {ownersLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading owners…
                    </div>
                  ) : owners.length === 0 ? (
                    <Text variant="muted" className="text-sm">
                      No owners assigned yet.
                    </Text>
                  ) : (
                    <div className="space-y-2">
                      {owners.map((owner) => (
                        <div
                          key={owner.user_id}
                          className="flex min-w-0 flex-col gap-2 rounded border border-border/70 bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                        >
                          <Text className="text-sm text-foreground truncate">
                            {owner.username ? `@${owner.username}` : owner.user_id}{" "}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">({owner.role})</span>
                          </Text>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto justify-start"
                            onClick={() => void handleRemoveOwner(owner.user_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Add owner by username or user ID</label>
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Input
                      value={ownerInput}
                      onChange={(e) => setOwnerInput(e.target.value)}
                      placeholder="username or user id"
                      className="w-full sm:w-72 sm:max-w-sm"
                    />
                    <Button onClick={() => void handleAddOwner()} disabled={ownerSaving} className="w-full sm:w-auto">
                      {ownerSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding…
                        </>
                      ) : (
                        "Add owner"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section>
            <Card className="border border-slate-200 bg-white shadow-sm w-full">
              <CardHeader className="space-y-1">
                <Heading as="h2" size="md" className="text-foreground">
                  Events
                </Heading>
                <Text variant="muted" className="text-sm">
                  Create new events or edit existing entries for this venue.
                </Text>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Heading as="h3" size="sm" className="text-foreground">
                    Create / edit event
                  </Heading>
                  <div className="grid gap-4 md:grid-cols-2 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Title*</label>
                      <Input
                        value={eventForm.title}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Event type</label>
                      <Input
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, event_type: e.target.value }))}
                        placeholder="Match, open_day, maintenance..."
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Starts at*</label>
                      <Input
                        type="datetime-local"
                        value={eventForm.starts_at}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Ends at</label>
                      <Input
                        type="datetime-local"
                        value={eventForm.ends_at}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Ticket info</label>
                      <Input
                        value={eventForm.ticket_info}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, ticket_info: e.target.value }))}
                        placeholder="£25, 30 pegs, payout to top 3"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Website URL</label>
                      <Input
                        value={eventForm.website_url}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, website_url: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Booking URL</label>
                      <Input
                        value={eventForm.booking_url}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                        placeholder="https://example.com/book"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2 min-w-0">
                      <label className="text-sm font-semibold text-slate-800">Description</label>
                      <Textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 w-full sm:w-auto">
                      <input
                        id="is_published"
                        type="checkbox"
                        checked={eventForm.is_published}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                      />
                      <label htmlFor="is_published" className="text-sm font-semibold text-slate-800">
                        Published
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <Button onClick={handleSaveEvent} disabled={eventSaving} className="rounded-full w-full sm:w-auto">
                      {eventSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save event"
                      )}
                    </Button>
                    <Button variant="ghost" onClick={() => handleEditEvent(undefined)} className="rounded-full w-full sm:w-auto">
                      Clear form
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Heading as="h3" size="sm" className="text-foreground">
                      All events
                    </Heading>
                    {eventsLoading ? (
                      <Text variant="muted" className="text-xs">
                        Loading…
                      </Text>
                    ) : (
                      <Text variant="muted" className="text-xs">
                        {events.length} event{events.length === 1 ? "" : "s"}
                      </Text>
                    )}
                  </div>
                  {eventsLoading ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading events…
                    </div>
                  ) : events.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                      No events yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event) => {
                        const status = classifyEventStatus(event);
                        const statusStyle =
                          status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : status === "upcoming"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700";
                        return (
                          <div
                            key={event.id}
                            className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <Heading as="h4" size="sm" className="text-foreground line-clamp-1">
                                {event.title}
                              </Heading>
                              <Text variant="muted" className="text-xs truncate">
                                {new Date(event.starts_at).toLocaleString()} {event.event_type ? `• ${event.event_type}` : ""}
                              </Text>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle}`}>
                                {status === "draft" ? "Draft" : status === "upcoming" ? "Upcoming" : "Past"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full w-full sm:w-auto"
                                onClick={() => handleEditEvent(event)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-red-600 hover:text-red-700 w-full sm:w-auto"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default AdminVenueEdit;
