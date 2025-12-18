import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "./integrations/supabase/client";

// Eager load: Critical pages (landing and auth)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load: All other pages for code splitting
const Feed = lazy(() => import("./pages/Feed"));
const AddCatch = lazy(() => import("./pages/AddCatch"));
const CatchDetail = lazy(() => import("./pages/CatchDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const VenueDetail = lazy(() => import("./pages/VenueDetail"));
const VenuesIndex = lazy(() => import("./pages/VenuesIndex"));
const AccountDeleted = lazy(() => import("./pages/AccountDeleted"));
const Sessions = lazy(() => import("./pages/Sessions"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminUserModeration = lazy(() => import("./pages/AdminUserModeration"));
const AdminVenuesList = lazy(() => import("./pages/AdminVenuesList"));
const AdminVenueEdit = lazy(() => import("./pages/AdminVenueEdit"));
const MyVenues = lazy(() => import("./pages/MyVenues"));
const MyVenueEdit = lazy(() => import("./pages/MyVenueEdit"));
const SearchPage = lazy(() => import("./pages/Search"));
const Insights = lazy(() => import("./pages/Insights"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
};

const DeletedAccountGate = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "ok" | "redirecting">("ok");

  useEffect(() => {
    let active = true;
    const checkDeletedProfile = async () => {
      if (location.pathname === "/account-deleted") {
        setStatus("ok");
        return;
      }
      if (loading) {
        setStatus("checking");
        return;
      }
      if (!user) {
        setStatus("ok");
        return;
      }

      setStatus("checking");
      const { data, error } = await supabase
        .from("profiles")
        .select("is_deleted")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error("Failed to check profile deletion status", error);
        setStatus("ok");
        return;
      }
      if (data?.is_deleted) {
        setStatus("redirecting");
        await supabase.auth.signOut();
        navigate("/account-deleted", { replace: true });
      } else {
        setStatus("ok");
      }
    };

    void checkDeletedProfile();

    return () => {
      active = false;
    };
  }, [user, loading, navigate, location.pathname]);

  if (status === "checking" || status === "redirecting") {
    return <PageLoader />;
  }

  return children;
};

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <DeletedAccountGate>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/venues" element={<VenuesIndex />} />
                <Route path="/venues/:slug" element={<VenueDetail />} />
                <Route
                  path="/feed"
                  element={
                    <RequireAuth>
                      <Feed />
                    </RequireAuth>
                  }
                />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route
                  path="/add-catch"
                  element={
                    <RequireAuth>
                      <AddCatch />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/catch/:id"
                  element={
                    <RequireAuth>
                      <CatchDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile/:slug"
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/settings/profile"
                  element={
                    <RequireAuth>
                      <ProfileSettings />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <RequireAuth>
                      <Sessions />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <RequireAuth>
                      <AdminReports />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/audit-log"
                  element={
                    <RequireAuth>
                      <AdminAuditLog />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/users/:userId/moderation"
                  element={
                    <RequireAuth>
                      <AdminUserModeration />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/venues"
                  element={
                    <RequireAuth>
                      <AdminVenuesList />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/venues/:slug"
                  element={
                    <RequireAuth>
                      <AdminVenueEdit />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <RequireAuth>
                      <SearchPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <RequireAuth>
                      <Insights />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my/venues"
                  element={
                    <RequireAuth>
                      <MyVenues />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my/venues/:slug"
                  element={
                    <RequireAuth>
                      <MyVenueEdit />
                    </RequireAuth>
                  }
                />
                <Route path="/account-deleted" element={<AccountDeleted />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </DeletedAccountGate>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
