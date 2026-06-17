import { ReactNode, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "../../hooks/usePathname";
import { useRouter } from "../../hooks/useRouter";
import { useSession } from "../../hooks/useSession";
import { env } from "../../adapters/env";
import { hasAnyRole } from "../../helpers/rolesHelper";
import { enterStudioMode } from "../../redux/features/solidStudioSlice";
import { LayoutContext } from "./context/layoutcontext";

type AdminHeaderActionsProps = {
  variant: "header" | "sidebar";
  className?: string;
};

type AdminAction = {
  key: string;
  label: string;
  onClick: () => void;
  title: string;
  icon?: ReactNode;
};

export const StudioSparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const ThemeToggleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 3l0 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 9l4.65 -4.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 14.3l7.37 -7.37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19.6l8.85 -8.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AdminHeaderActions = ({ variant, className = "" }: AdminHeaderActionsProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { toggleThemeMode, themeMode } = useContext(LayoutContext);
  const user = session?.user;
  const isAdmin = hasAnyRole(user?.roles, ["Admin"]);
  const isStudioMode = useSelector((state: any) => state.solidStudio?.isStudioMode ?? false);
  const isDev = env("VITE_SOLIDX_ENV") === "dev";
  const showBack = /\/admin\/core\/[^/]+\/[^/]+\/form\/[^/]+/.test(pathname);

  const actions: AdminAction[] = [
    ...(isAdmin && isDev && !isStudioMode
      ? [{
        key: "studio",
        label: "Studio",
        onClick: () => {
          dispatch(enterStudioMode());
          router.push("/studio");
        },
        title: "Enter SolidX Studio",
        icon: <StudioSparkleIcon />,
      }]
      : []),
    {
      key: "theme",
      label: themeMode === "dark" ? "Light Mode" : "Dark Mode",
      onClick: toggleThemeMode,
      title: "Toggle theme",
      icon: <ThemeToggleIcon />,
    },
    ...(showBack
      ? [{
        key: "back",
        label: "Back",
        onClick: () => router.back(),
        title: "Go back",
      }]
      : []),
  ];

  if (!actions.length) {
    return null;
  }

  if (variant === "sidebar") {
    return (
      <div className={`solid-sidebar-mobile-actions md:hidden ${className}`.trim()}>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            className="solid-sidebar-mobile-action"
            onClick={action.onClick}
            title={action.title}
            aria-label={action.title}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`solid-admin-header-actions hidden md:flex ${className}`.trim()}>
      {actions.map((action) => {
        if (action.key === "studio") {
          return (
            <button
              key={action.key}
              type="button"
              className="solid-studio-trigger-btn"
              onClick={action.onClick}
              title={action.title}
              aria-label={action.title}
            >
              {action.icon}
              <span className="solid-studio-trigger-label">{action.label}</span>
            </button>
          );
        }

        if (action.key === "theme") {
          return (
            <button
              key={action.key}
              type="button"
              className="solid-admin-theme-toggle"
              onClick={action.onClick}
              aria-label={action.title}
              title={action.title}
            >
              {action.icon}
              <span className="solid-sr-only">{action.label}</span>
            </button>
          );
        }

        return (
          <button
            key={action.key}
            type="button"
            className="solid-admin-back-btn"
            onClick={action.onClick}
            aria-label={action.title}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
};
