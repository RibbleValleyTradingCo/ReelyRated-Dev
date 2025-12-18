import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { useAuth } from "@/components/AuthProvider";

const DeletedAccountGate = ({ children }: { children: ReactNode }) => {
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
    if (import.meta.env.DEV) console.log("DeletedAccountGate loading");
    return <RouteSkeleton />;
  }

  return <>{children}</>;
};

export default DeletedAccountGate;
