import type { ReactNode } from "react";
import type { RouteObject } from "react-router-dom";

export type SolidRouteKey =
  | "error"
  | "notFound"
  | "login"
  | "register"
  | "forgotPassword"
  | "initiateForgotPassword"
  | "initiateForgotPasswordThankYou"
  | "confirmForgotPassword"
  | "resetPassword"
  | "otpVerify"
  | "initiateLogin"
  | "initiateRegister"
  | "initiateGoogleOauth"
  | "sso"
  | "admin"
  | "moduleHome"
  | "dashboard"
  | "list"
  | "tree"
  | "kanban"
  | "form"
  | "settings"
  | "authLayout"
  | "adminLayout"
  | "authGuard"
  | "adminGuard"
  | "studioHome"
  | "landing";

export type SolidRoutesOptions = {
  extraAuthRoutes?: RouteObject[];
  extraAdminRoutes?: RouteObject[];
  extraRoutes?: RouteObject[];
  elementOverrides?: Partial<Record<SolidRouteKey, ReactNode>>;
};
