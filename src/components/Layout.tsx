import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import DeletedAccountGate from "@/components/DeletedAccountGate";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-[calc(var(--nav-height)+1px)]">
        <Suspense fallback={<RouteSkeleton />}>
          <DeletedAccountGate>
            <Outlet />
          </DeletedAccountGate>
        </Suspense>
      </main>
    </div>
  );
};

export default Layout;
