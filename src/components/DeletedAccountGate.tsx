import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { useAuth } from "@/components/AuthProvider";

const DeletedAccountGate = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "ok" | "redirecting">("ok");
  const hasCheckedRef = useRef(false);
  const lastCheckedAtRef = useRef(0);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const checkDeletedProfile = async () => {
      if (location.pathname === "/account-deleted") {
        setStatus("ok");
        hasCheckedRef.current = true;
        return;
      }
      if (user?.id !== lastUserIdRef.current) {
        lastUserIdRef.current = user?.id ?? null;
        hasCheckedRef.current = false;
      }
      if (loading) {
        if (!hasCheckedRef.current) {
          setStatus("checking");
        }
        return;
      }
      if (!user) {
        setStatus("ok");
        hasCheckedRef.current = true;
        return;
      }

      const now = Date.now();
      if (hasCheckedRef.current && now - lastCheckedAtRef.current < 60000) {
        return;
      }
      lastCheckedAtRef.current = now;
      const shouldBlockUi = !hasCheckedRef.current;
      if (shouldBlockUi) {
        setStatus("checking");
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("is_deleted")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error("Failed to check profile deletion status", error);
        if (shouldBlockUi) {
          setStatus("ok");
        }
        hasCheckedRef.current = true;
        return;
      }
      if (data?.is_deleted) {
        setStatus("redirecting");
        await supabase.auth.signOut();
        navigate("/account-deleted", { replace: true });
      } else {
        if (shouldBlockUi) {
          setStatus("ok");
        }
        hasCheckedRef.current = true;
      }
    };

    void checkDeletedProfile();

    return () => {
      active = false;
    };
  }, [user, loading, navigate, location.pathname]);

  if (status === "checking" || status === "redirecting") {
    if (import.meta.env.DEV) console.log("DeletedAccountGate loading");
    return <RouteSkeleton />;
  }

  return <>{children}</>;
};

export default DeletedAccountGate;
