import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { hasAnyRole } from "../../helpers/rolesHelper";

export function AdminGuard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!hasAnyRole(session?.user?.roles, ["Admin"])) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
}
