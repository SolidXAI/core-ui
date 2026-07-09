import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { hasAnyRole } from "../../helpers/rolesHelper";
import { SolidLoadingState } from "../../components/common/SolidLoadingState";

export function AdminGuard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <SolidLoadingState
        title="Checking access"
        description="We are verifying your session and access permissions."
      />
    );
  }

  if (!hasAnyRole(session?.user?.roles, ["Admin"])) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
}
