import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession";

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

    if (base === "auth") return "/auth/login";

    return `/${base}/auth/login`;
  };

  const resolveLoginRoute = getLoginRoute || defaultGetLoginRoute;

  if (status === "loading") {
    return <div>Loading...</div>;
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