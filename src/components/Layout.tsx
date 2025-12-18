import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import DeletedAccountGate from "@/components/DeletedAccountGate";

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Suspense fallback={<RouteSkeleton />}>
        <DeletedAccountGate>
          <Outlet />
        </DeletedAccountGate>
      </Suspense>
    </div>
  );
};

export default Layout;
