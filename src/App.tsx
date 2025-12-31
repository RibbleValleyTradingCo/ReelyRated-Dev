import { Suspense, lazy, useEffect, useMemo, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  isRouteErrorResponse,
  Link,
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "./integrations/supabase/client";
import Layout from "@/components/Layout";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";
import { logger } from "@/lib/logger";

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
    console.log("RequireAuth loading");
    return <RouteSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
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

const RouteErrorElement = () => {
  const error = useRouteError();
  const location = useLocation();
  const navigate = useNavigate();
  const isRouteError = isRouteErrorResponse(error);
  const status = isRouteError ? error.status : null;
  const statusText = isRouteError ? error.statusText : null;
  const isAuthError = status === 401 || status === 403;
  const isChunkError =
    error instanceof Error &&
    (error.name === "ChunkLoadError" ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("dynamically imported module"));
  const title = isChunkError
    ? "Update required"
    : isRouteError
      ? `${status} ${statusText}`
      : "Something went wrong";
  const description = isChunkError
    ? "We couldn't load the latest version of the app."
    : isAuthError
      ? "You need to sign in to access this page."
      : isRouteError
        ? "We hit an issue loading this page. Please try again."
        : "An unexpected error occurred while loading this page.";

  const logSignature = useMemo(() => {
    if (isRouteError) {
      return `route-response|${location.pathname}${location.search}|${status}|${statusText}`;
    }
    if (isChunkError) {
      return `chunk-error|${location.pathname}${location.search}`;
    }
    if (error instanceof Error) {
      return `error|${location.pathname}${location.search}|${error.name}|${error.message}`;
    }
    return `unknown-error|${location.pathname}${location.search}`;
  }, [error, isChunkError, isRouteError, location.pathname, location.search, status, statusText]);

  const lastLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastLoggedRef.current === logSignature) return;
    lastLoggedRef.current = logSignature;
    const message = isChunkError
      ? "Route error: chunk load failed"
      : isRouteError
        ? "Route error response"
        : "Route error";
    const metadata = {
      path: location.pathname,
      search: location.search,
      status,
      statusText,
    };
    const errorToLog = !isRouteError && error instanceof Error ? error : undefined;
    logger.error(message, errorToLog, metadata);
  }, [error, isChunkError, isRouteError, location.pathname, location.search, logSignature, status, statusText]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-5xl py-12 md:py-16">
        <Section>
          <div className="flex min-h-[70vh] items-center justify-center">
            <Card className="w-full max-w-2xl border-border/70">
              <div className="space-y-4 p-6 sm:p-8 text-center">
                <Eyebrow className="text-muted-foreground">{status ?? "Error"}</Eyebrow>
                <Heading as="h2" size="lg" className="text-foreground">
                  {title}
                </Heading>
                <Text variant="muted" className="text-sm">
                  {description}
                </Text>
                {isChunkError && (
                  <Text variant="small" className="text-xs">
                    Reload the page to fetch the latest version.
                  </Text>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 justify-center">
                  <Button asChild className="w-full min-h-[44px]">
                    <Link to="/">Go home</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full min-h-[44px]"
                    onClick={() => navigate(-1)}
                  >
                    Back
                  </Button>
                  {isAuthError && (
                    <Button asChild variant="outline" className="w-full min-h-[44px]">
                      <Link to="/auth">Sign in</Link>
                    </Button>
                  )}
                  {isChunkError && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-[44px]"
                      onClick={() => window.location.reload()}
                    >
                      Reload page
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </Section>
      </PageContainer>
    </div>
  );
};

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/auth" element={<Auth />} errorElement={<RouteErrorElement />} />
      <Route path="/account-deleted" element={<AccountDeleted />} errorElement={<RouteErrorElement />} />
      <Route element={<Layout />} errorElement={<RouteErrorElement />}>
        <Route path="/" element={<Index />} />
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
        <Route path="*" element={<NotFound />} />
      </Route>
    </>
  )
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<RouteSkeleton />}>
            <RouterProvider router={router} fallbackElement={<RouteSkeleton />} />
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
