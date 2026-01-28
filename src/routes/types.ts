import type { RouteObject } from "react-router-dom";

export type SolidRoutesOptions = {
  extraAuthRoutes?: RouteObject[];
  extraAdminRoutes?: RouteObject[];
  extraRoutes?: RouteObject[];
};
