import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession";

type AuthGuardProps = {
  getLoginRoute?: (pathname: string) => string;
};

export function AuthGuard({ getLoginRoute }: AuthGuardProps) {
  const location = useLocation();
  const { status } = useSession();

  const defaultGetLoginRoute = (pathname: string) => {
    // Always redirect to the standard login route
    return "/auth/login";
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