import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type OwnedVenue = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  short_tagline: string | null;
  price_from: string | null;
};

const MyVenues = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<OwnedVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    const loadVenues = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("venue_owners")
        .select("venues:venue_id (id, slug, name, location, short_tagline, price_from)")
        .eq("user_id", user.id);
      if (error) {
        console.error("Failed to load venues", error);
        toast.error("Unable to load your venues");
        setVenues([]);
      } else {
        type OwnerVenueRow = {
          venues: {
            id: string;
            slug: string;
            name: string;
            location: string | null;
            short_tagline: string | null;
            price_from: string | null;
          };
        };
        const rows = (data ?? []) as unknown as OwnerVenueRow[];
        setVenues(
          rows.map((row) => ({
            id: row.venues.id,
            slug: row.venues.slug,
            name: row.venues.name,
            location: row.venues.location,
            short_tagline: row.venues.short_tagline,
            price_from: row.venues.price_from,
          }))
        );
      }
      setIsLoading(false);
    };
    void loadVenues();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <Navbar />
        <div className="container mx-auto flex items-center justify-center px-4 py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your venues…
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
            <h1 className="text-3xl font-bold text-foreground">My venues</h1>
            <p className="text-sm text-muted-foreground">Manage the venues you own.</p>
          </div>
        </div>

        {venues.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No venues yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You don&apos;t currently manage any venues. Ask an admin to assign you as an owner.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {venues.map((venue) => (
              <Card key={venue.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{venue.location ?? "Location not set"}</p>
                  <p className="text-sm text-foreground">
                    {venue.short_tagline || "No tagline yet."}
                  </p>
                  {venue.price_from ? (
                    <p className="text-xs text-muted-foreground">From {venue.price_from}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link to={`/venues/${venue.slug}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/my/venues/${venue.slug}`}>Manage</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVenues;
