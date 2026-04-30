import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthGuard } from "./guards/AuthGuard";
import { AdminGuard } from "./guards/AdminGuard";
import { AdminLayoutWrapper } from "../layouts/AdminLayoutWrapper";
import { AuthLayoutWrapper } from "../layouts/AuthLayoutWrapper";
import { ErrorPage } from "./pages/ErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { ModuleHomePage } from "./pages/admin/core/ModuleHomePage";
import { ListPage } from "./pages/admin/core/ListPage";
import { KanbanPage } from "./pages/admin/core/KanbanPage";
import { CardPage } from "./pages/admin/core/CardPage";
import { FormPage } from "./pages/admin/core/FormPage";
import { SettingsPage } from "./pages/admin/core/SettingsPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { InitiateForgotPasswordPage } from "./pages/auth/InitiateForgotPasswordPage";
import { InitiateForgotPasswordThankYouPage } from "./pages/auth/InitiateForgotPasswordThankYouPage";
import { ConfirmForgotPasswordPage } from "./pages/auth/ConfirmForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { InitiateLoginPage } from "./pages/auth/InitiateLoginPage";
import { InitiateRegisterPage } from "./pages/auth/InitiateRegisterPage";
import { InitiateGoogleOauthPage } from "./pages/auth/InitiateGoogleOauthPage";
import { InitiateFacebookOauthPage } from "./pages/auth/InitiateFacebookOauthPage";
import { InitiateMicrosoftOauthPage } from "./pages/auth/InitiateMicrosoftOauthPage";
import { SsoPage } from "./pages/auth/SsoPage";
import type { SolidRoutesOptions, SolidRouteKey } from "./types";
import { TreePage } from "./pages/admin/core/TreePage";
import { DashboardPage } from "./pages/admin/core/DashboardPage";
import { StudioHomePage } from "./pages/studio/StudioHomePage";
import { StudioLandingPage } from "./pages/studio/StudioLandingPage";
import { _solidRegisterExtraRoutes } from "./SolidLayoutRegistry";

export function getSolidRoutes(options: SolidRoutesOptions = {}): RouteObject[] {
  const {
    extraAuthRoutes = [],
    extraAdminRoutes = [],
    extraRoutes = [],
    elementOverrides = {},
  } = options;

  // Auto-register layout routes so StudioLandingPage can discover them
  // without any changes in the consuming project.
  _solidRegisterExtraRoutes(extraRoutes);

  const pick = (key: SolidRouteKey, fallback: JSX.Element) =>
    (elementOverrides[key] as JSX.Element) || fallback;

  const authChildren: RouteObject[] = [
    // Password based login, Passwordless login initiate otp
    { path: "/auth/login", element: pick("login", <LoginPage />) },
    // Password based registration, Passwordless registration initiate otp
    { path: "/auth/register", element: pick("register", <RegisterPage />) },
    // Passwordless login confirm otp
    { path: "/auth/initiate-login", element: pick("initiateLogin", <InitiateLoginPage />) },
    // Passwordless registration confirm otp
    { path: "/auth/initiate-register", element: pick("initiateRegister", <InitiateRegisterPage />) },

    // Forgot password flow
    { path: "/auth/forgot-password", element: pick("forgotPassword", <ForgotPasswordPage />) },
    { path: "/auth/initiate-forgot-password", element: pick("initiateForgotPassword", <InitiateForgotPasswordPage />) },
    { path: "/auth/initiate-forgot-password-thank-you", element: pick("initiateForgotPasswordThankYou", <InitiateForgotPasswordThankYouPage />) },
    { path: "/auth/confirm-forgot-password", element: pick("confirmForgotPassword", <ConfirmForgotPasswordPage />) },

    // ??? not used ???
    { path: "/auth/reset-password", element: pick("resetPassword", <ResetPasswordPage />) },

    { path: "/auth/initiate-google-oauth", element: pick("initiateGoogleOauth", <InitiateGoogleOauthPage />) },
    { path: "/auth/initiate-facebook-oauth", element: pick("initiateFacebookOauth", <InitiateFacebookOauthPage />) },
    { path: "/auth/initiate-microsoft-oauth", element: pick("initiateMicrosoftOauth", <InitiateMicrosoftOauthPage />) },
    { path: "/auth/sso", element: pick("sso", <SsoPage />) },
    ...extraAuthRoutes,
  ];

  const adminChildren: RouteObject[] = [
    { path: "/admin", element: pick("admin", <AdminPage />) },
    { path: "/admin/core/:moduleName/home", element: pick("moduleHome", <ModuleHomePage />) },
    { path: "/admin/core/:moduleName/dashboards/:dashboardName", element: pick("dashboard", <DashboardPage />) },
    { path: "/admin/core/:moduleName/:modelName/list", element: pick("list", <ListPage />) },
    { path: "/admin/core/:moduleName/:modelName/tree", element: pick("tree", <TreePage />) },
    { path: "/admin/core/:moduleName/:modelName/kanban", element: pick("kanban", <KanbanPage />) },
    { path: "/admin/core/:moduleName/:modelName/card", element: pick("card", <CardPage />) },
    { path: "/admin/core/:moduleName/:modelName/form/:id", element: pick("form", <FormPage />) },
    { path: "/admin/core/:moduleName/settings/:settings", element: pick("settings", <SettingsPage />) },
    ...extraAdminRoutes,
  ];

  return [
    { path: "/error", element: pick("error", <ErrorPage />) },
    { path: "/not-found", element: pick("notFound", <NotFoundPage />) },
    { element: pick("authLayout", <AuthLayoutWrapper />), children: authChildren },
    {
      element: pick("authGuard", <AuthGuard />),
      children: [
        {
          element: pick("adminLayout", <AdminLayoutWrapper />),
          children: adminChildren,
        },
        {
          element: pick("adminGuard", <AdminGuard />),
          children: [
            { path: "/studio", element: pick("studioHome", <StudioHomePage />) },
            { path: "/landing", element: pick("landing", <StudioLandingPage />) },
          ],
        },
      ],
    },
    ...extraRoutes,
    { path: "/", element: <Navigate to="/auth/login" replace /> },
    { path: "*", element: <Navigate to="/not-found" replace /> },
  ];
}
