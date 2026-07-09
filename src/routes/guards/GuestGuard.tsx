import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { SolidLoadingState } from "../../components/common/SolidLoadingState";

export function GuestGuard() {
  const { status } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated" && location.pathname.startsWith("/auth")) {
      navigate("/admin", { replace: true });
    }
  }, [status, navigate]);

  if (status === "loading" || status === "authenticated") {
    return (
      <SolidLoadingState
        title="Loading"
        description="Please wait while we route you to the right place."
      />
    );
  }

  return <Outlet />;
}
