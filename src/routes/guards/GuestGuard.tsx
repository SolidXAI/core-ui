import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../hooks/useSession";

export function GuestGuard() {
  const { status } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/admin", { replace: true });
    }
  }, [status, navigate]);

  if (status === "loading" || status === "authenticated") {
    return <div>Loading...</div>;
  }

  return <Outlet />;
}