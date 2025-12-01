import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Shield } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
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

  const loadVenues = async (nextOffset = 0, append = false) => {
    const limit = 20;
    if (nextOffset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const { data, error } = await supabase.rpc("get_venues", {
      p_search: debouncedQuery.length > 0 ? debouncedQuery : null,
      p_limit: limit,
      p_offset: nextOffset,
    });

    if (error) {
      console.error("Failed to load venues", error);
      setVenues(append ? venues : []);
      setHasMore(false);
      toast.error("Failed to load venues");
    } else {
      const fetched = (data as Venue[]) ?? [];
      setVenues(append ? [...venues, ...fetched] : fetched);
      setHasMore(fetched.length === limit);
      setOffset(nextOffset + fetched.length);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
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
      void loadVenues(0, false);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      void loadVenues(offset, true);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <main className="section-container py-10 md:py-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">Manage venues</h1>
            <p className="text-sm text-slate-600">Search, review, and edit venue metadata.</p>
          </div>
          <div className="w-full max-w-md">
            <Input
              placeholder="Search venues by name or location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading venues…
          </div>
        ) : venues.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-600">
            No venues found. Try a different search.
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {venues.map((venue) => (
              <Card
                key={venue.id}
                className="flex flex-col border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900">{venue.name}</CardTitle>
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {venue.location || "Location pending"}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {venue.short_tagline || "No tagline set"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to={`/admin/venues/${venue.slug}`}>Edit</Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4 pb-5 text-sm text-slate-600">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {venue.total_catches ?? 0} total
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {venue.recent_catches_30d ?? 0} in last 30d
                  </span>
                  {venue.upcoming_events_count !== undefined ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {venue.upcoming_events_count} upcoming events
                    </span>
                  ) : null}
                  <Link
                    to={`/venues/${venue.slug}`}
                    className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
                  >
                    View public page
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {venues.length > 0 && hasMore ? (
          <div className="mt-12 flex justify-center">
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
        ) : null}
      </main>
    </div>
  );
};

export default AdminVenuesList;
