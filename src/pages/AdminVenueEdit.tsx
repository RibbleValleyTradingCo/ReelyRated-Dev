import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";

type Venue = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  short_tagline: string | null;
  ticket_type: string | null;
  price_from: string | null;
  best_for_tags: string[] | null;
  facilities: string[] | null;
  website_url: string | null;
  booking_url: string | null;
  contact_phone: string | null;
  notes_for_rr_team: string | null;
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
    ticket_type: "",
    price_from: "",
    best_for_tags: "",
    facilities: "",
    website_url: "",
    booking_url: "",
    contact_phone: "",
    notes_for_rr_team: "",
  });

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

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!venue?.id) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_update_venue_metadata", {
      p_venue_id: venue.id,
      p_short_tagline: form.short_tagline || null,
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
      // refresh
      const { data } = await supabase.rpc("get_venue_by_slug", { p_slug: slug });
      const row = (data as Venue[] | null)?.[0] ?? null;
      setVenue(row);
    }
    setSaving(false);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <Navbar />
        <div className="section-container flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading venue…
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <Navbar />
        <div className="section-container py-12">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Venue not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">This venue doesn&apos;t exist or isn&apos;t published.</p>
              <Button asChild variant="outline">
                <Link to="/admin/venues">Back to admin venues</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <main className="section-container space-y-6 py-8 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900">Edit venue</h1>
            <p className="text-sm text-slate-600">{venue.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" asChild className="rounded-full">
              <Link to={`/venues/${venue.slug}`}>View public page</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full">
              <Link to="/admin/venues">Back to list</Link>
            </Button>
          </div>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Short tagline</label>
                <Input
                  value={form.short_tagline}
                  onChange={(e) => setForm((prev) => ({ ...prev, short_tagline: e.target.value }))}
                  placeholder="Big carp day-ticket venue with 3 main lakes"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Ticket type</label>
                <Input
                  value={form.ticket_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, ticket_type: e.target.value }))}
                  placeholder="Day ticket, Syndicate, Club water, Coaching venue"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Price from</label>
                <Input
                  value={form.price_from}
                  onChange={(e) => setForm((prev) => ({ ...prev, price_from: e.target.value }))}
                  placeholder="from £10 / day"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Best for tags (comma separated)</label>
                <Input
                  value={form.best_for_tags}
                  onChange={(e) => setForm((prev) => ({ ...prev, best_for_tags: e.target.value }))}
                  placeholder="Carp, Match, Families"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Facilities (comma separated)</label>
                <Input
                  value={form.facilities}
                  onChange={(e) => setForm((prev) => ({ ...prev, facilities: e.target.value }))}
                  placeholder="Toilets, Café, Tackle shop"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Website URL</label>
                <Input
                  value={form.website_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Booking URL</label>
                <Input
                  value={form.booking_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, booking_url: e.target.value }))}
                  placeholder="https://example.com/book"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Contact phone</label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+44 ..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">Internal notes (RR team only)</label>
              <Textarea
                value={form.notes_for_rr_team}
                onChange={(e) => setForm((prev) => ({ ...prev, notes_for_rr_team: e.target.value }))}
                placeholder="Internal notes not shown publicly"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full"
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
      </main>
    </div>
  );
};

export default AdminVenueEdit;
