import { ReactNode, useContext, useMemo } from "react";
// import { usePathname } from "../../hooks/usePathname";
import { LayoutContext } from "./context/layoutcontext";
import { BackendReconnectIndicator } from "../common/BackendReconnectIndicator";
import { useGetSolidSettingsQuery } from "../../redux/api/solidSettingsApi";
import { getSettingsMap } from "../../helpers/settingsPayload";

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
  // const pathname = usePathname();
  const { toggleThemeMode, themeMode } = useContext(LayoutContext);
  const { data: solidSettingsData } = useGetSolidSettingsQuery(undefined);
  const settingsMap = useMemo(() => getSettingsMap(solidSettingsData), [solidSettingsData]);
  const showThemeToggle = settingsMap?.showThemeToggle === true || settingsMap?.showThemeToggle === "true";
  // const showBack = /\/admin\/core\/[^/]+\/[^/]+\/form\/[^/]+/.test(pathname);

  const actions: AdminAction[] = [
    ...(showThemeToggle
      ? [{
        key: "theme",
        label: themeMode === "dark" ? "Light Mode" : "Dark Mode",
        onClick: toggleThemeMode,
        title: "Toggle theme",
        icon: <ThemeToggleIcon />,
      }]
      : []),
    // ...(showBack
    //   ? [{
    //     key: "back",
    //     label: "Back",
    //     onClick: () => router.back(),
    //     title: "Go back",
    //   }]
    //   : []),
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
    <div className={`solid-admin-header-actions max-md:hidden lg:flex ${className}`.trim()}>
      <BackendReconnectIndicator />
      {actions.map((action) => {
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
