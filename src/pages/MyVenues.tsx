import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";

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
        <PageContainer className="flex items-center justify-center px-4 sm:px-6 py-16">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <Text variant="muted">Loading your venues…</Text>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-5xl py-8 md:py-10">
        <div className="space-y-6 min-w-0">
          <Section>
            <SectionHeader
              eyebrow={<Eyebrow className="text-muted-foreground">Owner</Eyebrow>}
              title="My venues"
              subtitle="Manage the venues you own."
            />
          </Section>

          <Section>
            {venues.length === 0 ? (
              <Card className="w-full border-border/70">
                <CardHeader>
                  <Heading as="h2" size="md" className="text-foreground">
                    No venues yet
                  </Heading>
                </CardHeader>
                <CardContent>
                  <Text variant="muted" className="text-sm">
                    You don&apos;t currently manage any venues. Ask an admin to assign you as an owner.
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 min-w-0">
                {venues.map((venue) => (
                  <Card key={venue.id} className="min-w-0">
                    <CardHeader>
                      <CardTitle className="text-lg truncate">{venue.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 min-w-0">
                      <Text variant="muted" className="text-sm truncate">
                        {venue.location ?? "Location not set"}
                      </Text>
                      <Text className="text-sm text-foreground line-clamp-2">
                        {venue.short_tagline || "No tagline yet."}
                      </Text>
                      {venue.price_from ? (
                        <Text variant="muted" className="text-xs">
                          From {venue.price_from}
                        </Text>
                      ) : null}
                      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                        <Button asChild size="sm" className="w-full sm:w-auto">
                          <Link to={`/venues/${venue.slug}`}>View</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link to={`/my/venues/${venue.slug}`}>Manage</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default MyVenues;
