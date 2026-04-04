import { useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "../../hooks/usePathname";
import { useSearchParams } from "../../hooks/useSearchParams";
import { useRouter } from "../../hooks/useRouter";
import { useSession } from "../../hooks/useSession";
import { useGetSolidActionByIdQuery } from "../../redux/api/solidActionApi";
import { LayoutContext } from "./context/layoutcontext";
import { enterStudioMode } from "../../redux/features/solidStudioSlice";
import { hasAnyRole } from "../../helpers/rolesHelper";
import { env } from "../../adapters/env";

const SIDEBAR_TOGGLE_EVENT = "solidx:sidebar-toggle";

const toLabel = (value: string) =>
  decodeURIComponent(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const StudioSparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export const AdminTopHeader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toggleThemeMode } = useContext(LayoutContext);
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = hasAnyRole(user?.roles, ["Admin"]);
  const isStudioMode = useSelector((state: any) => state.solidStudio?.isStudioMode ?? false);
  const isDev = env("VITE_SOLIDX_ENV") === "dev";

  // We treat actionId as the source of truth for breadcrumb labels.
  // If present, we resolve module/model/action via action-metadata API
  // so breadcrumbs are consistent across list/form/tree/kanban pages.
  const actionId = searchParams.get("actionId");
  const { data: actionResponse } = useGetSolidActionByIdQuery(actionId as string, {
    skip: !actionId,
  });

  const crumbs = useMemo(() => {
    // API response shapes vary by adapter layer, so normalize defensively.
    const actionData = actionResponse?.data?.data ?? actionResponse?.data ?? actionResponse;
    const moduleFromApi = actionData?.module?.displayName || actionData?.module?.name;
    const modelFromApi = actionData?.model?.displayName || actionData?.model?.name;
    const actionFromApi = actionData?.displayName || actionData?.name;
    const actionDataId = actionData?.id != null ? String(actionData.id) : null;
    const hasMatchingActionData = Boolean(actionId) && actionDataId === actionId;

    // Priority 1: exact business breadcrumb contract requested:
    // <module> > <model> > <action>.
    // We only trust API crumbs when they belong to the current URL's actionId.
    // This avoids stale list breadcrumbs bleeding into form routes that do not
    // carry actionId in their query string.
    if (hasMatchingActionData && (moduleFromApi || modelFromApi || actionFromApi)) {
      return [moduleFromApi, modelFromApi, actionFromApi].filter(Boolean);
    }

    const segments = pathname.split("/").filter(Boolean);
    // Priority 2: derive from route segments when API data is unavailable.
    // This is intentionally ahead of query fallback so form pages don't
    // inherit stale list query labels after list -> form navigation.
    if (segments[0] === "admin" && segments[1] === "core") {
      const moduleName = segments[2];
      const modelName = segments[3];
      const viewName = segments[4];
      const next = [moduleName, modelName, viewName].filter(Boolean).map((item) => toLabel(item!));
      return next.length ? next : ["Admin"];
    }

    const menuItemName = searchParams.get("menuItemName");
    const actionName = searchParams.get("actionName");

    // Priority 3: legacy URL-query fallback for older links/pages.
    if (menuItemName || actionName) {
      return [menuItemName, actionName].filter(Boolean).map((item) => toLabel(item!));
    }

    return ["Admin"];
  }, [actionId, actionResponse, pathname, searchParams]);

  const showBack = /\/admin\/core\/[^/]+\/[^/]+\/form\/[^/]+/.test(pathname);

  const triggerSidebar = () => {
    window.dispatchEvent(new CustomEvent(SIDEBAR_TOGGLE_EVENT));
  };

  return (
    <header className="solid-admin-header">
      <div className="solid-admin-header-inner">
        <button
          type="button"
          className="solid-admin-sidebar-trigger"
          onClick={triggerSidebar}
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.5" y="2" width="13" height="12" rx="2" stroke="currentColor" />
            <path d="M5.5 2V14" stroke="currentColor" />
            <rect x="8" y="5.25" width="4.5" height="5.5" rx="0.9" stroke="currentColor" />
          </svg>
        </button>

        <div className="solid-admin-header-sep" />

        <nav className="solid-admin-breadcrumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb}-${index}`} className="solid-admin-crumb">
              {index > 0 && <span className="solid-admin-crumb-sep">›</span>}
              <span>{crumb}</span>
            </span>
          ))}
        </nav>

        <div className="solid-admin-header-actions">
          {isAdmin && isDev && !isStudioMode && (
            <button
              type="button"
              className="solid-studio-trigger-btn"
              onClick={() => { dispatch(enterStudioMode()); router.push("/studio"); }}
              title="Enter SolidX Studio"
            >
              <StudioSparkleIcon />
              Studio
            </button>
          )}

          <button
            type="button"
            className="solid-admin-theme-toggle"
            onClick={toggleThemeMode}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 3l0 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 9l4.65 -4.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 14.3l7.37 -7.37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19.6l8.85 -8.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="solid-sr-only">Toggle theme</span>
          </button>

          {showBack && (
            <button
              type="button"
              className="solid-admin-back-btn"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
