import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { SolidLoadingState } from "../../components/common/SolidLoadingState";

type AuthGuardProps = {
  getLoginRoute?: (pathname: string) => string;
};

export function AuthGuard({ getLoginRoute }: AuthGuardProps) {
  const location = useLocation();
  const { status } = useSession();

  const defaultGetLoginRoute = (pathname: string) => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) return "/auth/login";

    const base = segments[0];

    // routes that should NOT be treated as tenant
    const systemRoutes = ["admin", "auth"];

    if (systemRoutes.includes(base)) {
      return "/auth/login";
    }

    return `/${base}/auth/login`;
  };

  const resolveLoginRoute = getLoginRoute || defaultGetLoginRoute;

  if (status === "loading") {
    return (
      <SolidLoadingState
        title="Checking your session"
        description="We are confirming your sign-in status before opening this page."
      />
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={resolveLoginRoute(location.pathname)}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}
