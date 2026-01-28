import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthGuard } from "./guards/AuthGuard";
import { AdminLayoutWrapper } from "../layouts/AdminLayoutWrapper";
import { AuthLayoutWrapper } from "../layouts/AuthLayoutWrapper";
import { ErrorPage } from "./pages/ErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { ModuleHomePage } from "./pages/admin/core/ModuleHomePage";
import { ListPage } from "./pages/admin/core/ListPage";
import { KanbanPage } from "./pages/admin/core/KanbanPage";
import { FormPage } from "./pages/admin/core/FormPage";
import { SettingsPage } from "./pages/admin/core/SettingsPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { InitiateForgotPasswordPage } from "./pages/auth/InitiateForgotPasswordPage";
import { InitiateForgotPasswordThankYouPage } from "./pages/auth/InitiateForgotPasswordThankYouPage";
import { ConfirmForgotPasswordPage } from "./pages/auth/ConfirmForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { OtpVerifyPage } from "./pages/auth/OtpVerifyPage";
import { InitiateLoginPage } from "./pages/auth/InitiateLoginPage";
import { InitiateRegisterPage } from "./pages/auth/InitiateRegisterPage";
import { InitiateGoogleOauthPage } from "./pages/auth/InitiateGoogleOauthPage";
import { SsoPage } from "./pages/auth/SsoPage";
import type { SolidRoutesOptions } from "./types";

export function getSolidRoutes(options: SolidRoutesOptions = {}): RouteObject[] {
  const {
    extraAuthRoutes = [],
    extraAdminRoutes = [],
    extraRoutes = [],
  } = options;

  const authChildren: RouteObject[] = [
    { path: "/auth/login", element: <LoginPage /> },
    { path: "/auth/register", element: <RegisterPage /> },
    { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/auth/initiate-forgot-password", element: <InitiateForgotPasswordPage /> },
    { path: "/auth/initiate-forgot-password-thank-you", element: <InitiateForgotPasswordThankYouPage /> },
    { path: "/auth/confirm-forgot-password", element: <ConfirmForgotPasswordPage /> },
    { path: "/auth/reset-password", element: <ResetPasswordPage /> },
    { path: "/auth/otp-verify", element: <OtpVerifyPage /> },
    { path: "/auth/initiate-login", element: <InitiateLoginPage /> },
    { path: "/auth/initiate-register", element: <InitiateRegisterPage /> },
    { path: "/auth/initiate-google-oauth", element: <InitiateGoogleOauthPage /> },
    { path: "/auth/sso", element: <SsoPage /> },
    ...extraAuthRoutes,
  ];

  const adminChildren: RouteObject[] = [
    { path: "/admin", element: <AdminPage /> },
    { path: "/admin/core/:moduleName/home", element: <ModuleHomePage /> },
    { path: "/admin/core/:moduleName/:modelName/list", element: <ListPage /> },
    { path: "/admin/core/:moduleName/:modelName/kanban", element: <KanbanPage /> },
    { path: "/admin/core/:moduleName/:modelName/form/:id", element: <FormPage /> },
    { path: "/admin/core/:moduleName/settings/:settings", element: <SettingsPage /> },
    ...extraAdminRoutes,
  ];

  return [
    { path: "/error", element: <ErrorPage /> },
    { path: "/not-found", element: <NotFoundPage /> },
    { element: <AuthLayoutWrapper />, children: authChildren },
    {
      element: <AuthGuard />,
      children: [
        {
          element: <AdminLayoutWrapper />,
          children: adminChildren,
        },
      ],
    },
    ...extraRoutes,
    { path: "/", element: <Navigate to="/auth/login" replace /> },
    { path: "*", element: <Navigate to="/not-found" replace /> },
  ];
}
