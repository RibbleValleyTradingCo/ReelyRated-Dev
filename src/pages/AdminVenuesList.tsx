import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Shield } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";
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
  total_catches: number | null;
  recent_catches_30d: number | null;
  upcoming_events_count?: number;
};

const AdminVenuesList = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [adminStatus, setAdminStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const searchInputId = useId();
  const requestIdRef = useRef(0);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      setAdminStatus("checking");
      if (!user) {
        setAdminStatus("unauthorized");
        return;
      }
      const isAdmin = await isAdminUser(user.id);
      if (!isAdmin) {
        toast.error("You must be an admin to view this page.");
        navigate("/");
        setAdminStatus("unauthorized");
      } else {
        setAdminStatus("authorized");
      }
    };
    void checkAdmin();
  }, [authLoading, navigate, user]);

  const loadVenues = useCallback(
    async (nextOffset = 0, append = false, searchTerm = "") => {
      const limit = 20;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      if (nextOffset === 0) {
        setLoading(true);
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      const trimmedSearch = searchTerm.trim();
      const { data, error } = await supabase.rpc("get_venues", {
        p_search: trimmedSearch.length > 0 ? trimmedSearch : null,
        p_limit: limit,
        p_offset: nextOffset,
      });

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (error) {
        console.error("Failed to load venues", error);
        setVenues((prev) => (append ? prev : []));
        setHasMore(false);
        toast.error("Failed to load venues");
      } else {
        const fetched = (data as Venue[]) ?? [];
        setVenues((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(fetched.length === limit);
        setOffset(nextOffset + fetched.length);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    []
  );

  useEffect(() => {
    if (adminStatus !== "authorized") return;
    const handle = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedQuery) {
          next.set("q", debouncedQuery);
        } else {
          next.delete("q");
        }
        return next;
      });
      setActiveQuery(debouncedQuery);
      void loadVenues(0, false, debouncedQuery);
    }, 250);
    return () => clearTimeout(handle);
  }, [adminStatus, debouncedQuery, loadVenues, setSearchParams]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      void loadVenues(offset, true, activeQuery);
    }
  };

  if (adminStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="flex items-center justify-center py-16">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
          <Text variant="muted">Checking admin access…</Text>
        </PageContainer>
      </div>
    );
  }

  if (adminStatus === "unauthorized") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <PageContainer className="px-4 sm:px-6 py-12 overflow-x-hidden">
          <Card className="border border-border bg-card shadow-card w-full">
            <CardHeader>
              <Heading as="h2" size="md" className="text-foreground">
                Access denied
              </Heading>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text variant="muted" className="text-sm">
                You don&apos;t have permission to view this page.
              </Text>
              <Button asChild variant="outline">
                <Link to="/">Back to home</Link>
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
              title="Venues"
              subtitle="Search, review, and edit venue metadata."
              titleAs="h1"
            />
          </Section>

          <Section>
            <Card className="border-border/70 w-full">
              <CardContent className="flex flex-col gap-4 p-4 md:p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Heading as="h3" size="sm" className="text-foreground">
                    Search
                  </Heading>
                  <Text variant="muted" className="text-sm">
                    Find venues by name or location.
                  </Text>
                </div>
                <div className="w-full min-w-0 sm:w-auto sm:min-w-[260px]">
                  <label htmlFor={searchInputId} className="sr-only">
                    Search venues
                  </label>
                  <Input
                    id={searchInputId}
                    placeholder="Search venues by name or location"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 rounded-xl w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading venues…
              </div>
            ) : venues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/70 p-8 text-center text-muted-foreground">
                No venues found. Try a different search.
              </div>
            ) : (
              <div className="space-y-3">
                {venues.map((venue) => (
                  <Card
                    key={venue.id}
                    className="flex flex-col border border-border bg-card shadow-card transition hover:shadow-card-hover w-full"
                  >
                    <CardHeader className="flex min-w-0 flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-foreground truncate">{venue.name}</CardTitle>
                        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{venue.location || "Location pending"}</span>
                        </p>
                        <Text variant="muted" className="text-sm line-clamp-2">
                          {venue.short_tagline || "No tagline set"}
                        </Text>
                      </div>
                      <Button asChild variant="outline" size="sm" className="rounded-full w-full sm:w-auto">
                        <Link to={`/admin/venues/${venue.slug}`}>Edit</Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-2 sm:gap-4 pb-5 text-sm text-muted-foreground min-w-0">
                      <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground whitespace-nowrap">
                        {venue.total_catches ?? 0} total
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground whitespace-nowrap">
                        {venue.recent_catches_30d ?? 0} in last 30d
                      </span>
                      {venue.upcoming_events_count !== undefined ? (
                        <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground whitespace-nowrap">
                          {venue.upcoming_events_count} upcoming events
                        </span>
                      ) : null}
                      <Link
                        to={`/venues/${venue.slug}`}
                        className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline whitespace-nowrap"
                      >
                        View public page
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          {venues.length > 0 && hasMore && !loading ? (
            <Section>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="h-11 rounded-full px-6"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more venues"
                  )}
                </Button>
              </div>
            </Section>
          ) : null}
        </div>
      </PageContainer>
    </div>
  );
};

export default AdminVenuesList;
