import { useMemo } from "react";
import { usePathname } from "../../hooks/usePathname";
import { useSearchParams } from "../../hooks/useSearchParams";
import { useRouter } from "../../hooks/useRouter";
import { useGetSolidActionByIdQuery } from "../../redux/api/solidActionApi";
import { AdminHeaderActions } from "./AdminHeaderActions";

const SIDEBAR_TOGGLE_EVENT = "solidx:sidebar-toggle";

const toLabel = (value: string) =>
  decodeURIComponent(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

export const AdminTopHeader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

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
      const next = [
        moduleName ? toLabel(moduleName) : null,
        modelFromApi ? decodeURIComponent(modelFromApi) : modelName ? toLabel(modelName) : null,
        viewName ? toLabel(viewName) : null,
      ].filter(Boolean) as string[];
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

  const handleBreadcrumbClick = (crumbIndex: number) => {
    // When on a form view, clicking the model name (second crumb) should navigate back to list
    // Index 1 is the model name in a breadcrumb like: Module > Model > Action
    if (crumbIndex === 1 && showBack) {
      if (typeof window !== "undefined") {
        // First, try to use the full stored URL (preserves all query params)
        const storedFullUrl = sessionStorage.getItem("fromViewUrl");
        if (storedFullUrl) {
          router.push(storedFullUrl);
          return;
        }
      }
      
      // Fallback: construct URL from current path and stored view
      const segments = pathname.split("/").filter(Boolean);
      if (segments[0] === "admin" && segments[1] === "core") {
        const moduleName = segments[2];
        const modelName = segments[3];
        const fromView = typeof window !== "undefined" 
          ? sessionStorage.getItem("fromView") || "list" 
          : "list";
        router.push(`/admin/core/${moduleName}/${modelName}/${fromView}`);
      }
    }
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
              {index === 1 && showBack ? (
                <button
                  type="button"
                  className="solid-admin-crumb-link"
                  onClick={() => handleBreadcrumbClick(index)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", textDecoration: "underline" }}
                >
                  {crumb}
                </button>
              ) : (
                <span className="solid-bread-crum-text-wrapper">{crumb}</span>
              )}
            </span>
          ))}
        </nav>

        <AdminHeaderActions variant="header" />
      </div>
    </header>
  );
};
