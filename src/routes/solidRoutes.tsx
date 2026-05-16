import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthGuard } from "./guards/AuthGuard";
import { AdminGuard } from "./guards/AdminGuard";
import { GuestGuard } from "./guards/GuestGuard";
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
import { SolidRouteMetadataBoundary } from "./SolidRouteMetadataBoundary";

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
    { path: "/auth/login", element: pick("login", <LoginPage />), handle: { title: "Login", manageDocumentMeta: true } },
    // Password based registration, Passwordless registration initiate otp
    { path: "/auth/register", element: pick("register", <RegisterPage />), handle: { title: "Register", manageDocumentMeta: true } },
    // Passwordless login confirm otp
    { path: "/auth/initiate-login", element: pick("initiateLogin", <InitiateLoginPage />), handle: { title: "Verify Login", manageDocumentMeta: true } },
    // Passwordless registration confirm otp
    { path: "/auth/initiate-register", element: pick("initiateRegister", <InitiateRegisterPage />), handle: { title: "Verify Registration", manageDocumentMeta: true } },

    // Forgot password flow
    { path: "/auth/forgot-password", element: pick("forgotPassword", <ForgotPasswordPage />), handle: { title: "Forgot Password", manageDocumentMeta: true } },
    { path: "/auth/initiate-forgot-password", element: pick("initiateForgotPassword", <InitiateForgotPasswordPage />), handle: { title: "Send Reset Code", manageDocumentMeta: true } },
    { path: "/auth/initiate-forgot-password-thank-you", element: pick("initiateForgotPasswordThankYou", <InitiateForgotPasswordThankYouPage />), handle: { title: "Check Your Email", manageDocumentMeta: true } },
    { path: "/auth/confirm-forgot-password", element: pick("confirmForgotPassword", <ConfirmForgotPasswordPage />), handle: { title: "Confirm Reset Code", manageDocumentMeta: true } },

    // ??? not used ???
    { path: "/auth/reset-password", element: pick("resetPassword", <ResetPasswordPage />), handle: { title: "Reset Password", manageDocumentMeta: true } },

    { path: "/auth/initiate-google-oauth", element: pick("initiateGoogleOauth", <InitiateGoogleOauthPage />), handle: { title: "Google Sign In", manageDocumentMeta: true } },
    { path: "/auth/initiate-facebook-oauth", element: pick("initiateFacebookOauth", <InitiateFacebookOauthPage />), handle: { title: "Facebook Sign In", manageDocumentMeta: true } },
    { path: "/auth/initiate-microsoft-oauth", element: pick("initiateMicrosoftOauth", <InitiateMicrosoftOauthPage />), handle: { title: "Microsoft Sign In", manageDocumentMeta: true } },
    { path: "/auth/sso", element: pick("sso", <SsoPage />), handle: { title: "Single Sign-On", manageDocumentMeta: true } },
    ...extraAuthRoutes,
  ];

  const adminChildren: RouteObject[] = [
    { path: "/admin", element: pick("admin", <AdminPage />), handle: { title: "Admin", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/home", element: pick("moduleHome", <ModuleHomePage />), handle: { title: "Module Home", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/dashboards/:dashboardName", element: pick("dashboard", <DashboardPage />), handle: { title: "Dashboard", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/:modelName/list", element: pick("list", <ListPage />), handle: { title: "List", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/:modelName/tree", element: pick("tree", <TreePage />), handle: { title: "Tree", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/:modelName/kanban", element: pick("kanban", <KanbanPage />), handle: { title: "Kanban", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/:modelName/card", element: pick("card", <CardPage />), handle: { title: "Card", manageDocumentMeta: true } },
    { path: "/admin/core/:moduleName/:modelName/form/:id", element: pick("form", <FormPage />), handle: { title: "Form", manageDocumentMeta: true } },
    { path: "/admin/core/settings", element: pick("settings", <SettingsPage />), handle: { title: "Settings", manageDocumentMeta: true } },
    ...extraAdminRoutes,
  ];

  return [
    { path: "/error", element: pick("error", <ErrorPage />) },
    { path: "/not-found", element: pick("notFound", <NotFoundPage />) },
    {
      element: <GuestGuard />,
      children: [
        {
          element: pick("authLayout", <AuthLayoutWrapper />),
          children: [
            {
              element: <SolidRouteMetadataBoundary routes={authChildren} />,
              handle: { title: "Auth", description: "Authentication pages", manageDocumentMeta: true },
              children: authChildren,
            },
          ],
        },
      ],
    },
    {
      element: pick("authGuard", <AuthGuard />),
      children: [
        {
          element: pick("adminLayout", <AdminLayoutWrapper />),
          children: [
            {
              element: <SolidRouteMetadataBoundary routes={adminChildren} />,
              handle: { title: "Admin", description: "Administration pages", manageDocumentMeta: true },
              children: adminChildren,
            },
          ],
        },
        {
          element: pick("adminGuard", <AdminGuard />),
          children: [
            { path: "/studio", element: pick("studioHome", <StudioHomePage />), handle: { title: "Studio", manageDocumentMeta: true } },
            { path: "/landing", element: pick("landing", <StudioLandingPage />), handle: { title: "Landing", manageDocumentMeta: true } },
          ],
        },
      ],
    },
    ...extraRoutes,
    { path: "/", element: <Navigate to="/auth/login" replace /> },
    { path: "*", element: <Navigate to="/not-found" replace /> },
  ];
}
