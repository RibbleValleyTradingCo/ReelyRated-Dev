import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Separate contexts for each piece of auth state
// This allows components to subscribe only to what they need

interface AuthUserContextType {
  user: User | null;
}

interface AuthLoadingContextType {
  loading: boolean;
}

interface AuthSessionContextType {
  session: Session | null;
}

// Legacy combined context type for backwards compatibility
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthUserContext = createContext<AuthUserContextType>({ user: null });
const AuthLoadingContext = createContext<AuthLoadingContextType>({ loading: true });
const AuthSessionContext = createContext<AuthSessionContextType>({ session: null });

// Legacy combined context for backwards compatibility
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

// Optimized hooks - components should use these to subscribe only to what they need
export const useAuthUser = () => useContext(AuthUserContext);
export const useAuthLoading = () => useContext(AuthLoadingContext);
export const useAuthSession = () => useContext(AuthSessionContext);

// Legacy hook for backwards compatibility - avoid using this in new code
// as it causes re-renders when any auth state changes
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Memoize context values to prevent unnecessary re-renders
  const userValue = useMemo(() => ({ user }), [user]);
  const loadingValue = useMemo(() => ({ loading }), [loading]);
  const sessionValue = useMemo(() => ({ session }), [session]);
  const combinedValue = useMemo(() => ({ user, session, loading }), [user, session, loading]);

  return (
    <AuthUserContext.Provider value={userValue}>
      <AuthLoadingContext.Provider value={loadingValue}>
        <AuthSessionContext.Provider value={sessionValue}>
          <AuthContext.Provider value={combinedValue}>
            {children}
          </AuthContext.Provider>
        </AuthSessionContext.Provider>
      </AuthLoadingContext.Provider>
    </AuthUserContext.Provider>
  );
};
