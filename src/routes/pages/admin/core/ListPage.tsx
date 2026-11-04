import { SolidListView } from "../../../../components/core/list/SolidListView";
import { camelCase } from "lodash";
import { useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { SolidListViewHandle } from "../../../../components/core/list/SolidListView";
import { getListView, registerListView, unregisterListView } from "../../../../components/core/list/listViewRegistry";
import { usePathname } from "../../../../hooks/usePathname";
import { useRouter } from "../../../../hooks/useRouter";
import { resolveRetainedModelViewRoute, storeCurrentModelViewContext } from "../../../../helpers/modelViewPersistence";
import { isMatchingAdminViewRefresh, ADMIN_VIEW_REFRESH_REQUESTED, type AdminViewRefreshRequest } from "../../../../helpers/adminViewRefresh";
import { eventBus } from "../../../../helpers/eventBus";

export function ListPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const search = searchParams.toString();

  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";

  const menuItemId = searchParams.get("menuItemId") || "";
  const menuItemName = searchParams.get("menuItemName") || "";
  const actionId = searchParams.get("actionId") || "";
  const actionName = searchParams.get("actionName") || "";

  const listId = `page:${moduleName}:${modelName}:${menuItemId}:${menuItemName}:${actionId}:${actionName}`;

  const setListRef = useCallback((handle: SolidListViewHandle | null) => {
    if (handle) {
      registerListView(listId, handle);
      return;
    }
    unregisterListView(listId);
  }, [listId]);

  useEffect(() => {
    const currentUrl = search ? `${pathname}?${search}` : pathname;
    const retainedUrl = resolveRetainedModelViewRoute(currentUrl);
    if (retainedUrl !== currentUrl) {
      router.replace(retainedUrl);
      return;
    }

    storeCurrentModelViewContext(currentUrl);
  }, [pathname, search]);

  useEffect(() => eventBus.on<AdminViewRefreshRequest>(ADMIN_VIEW_REFRESH_REQUESTED, (request) => {
    if (isMatchingAdminViewRefresh(request, { moduleName, modelName, viewName: "list" })) {
      // The registered handle is the page's active list view; its refresh retains current filters.
      getListView(listId)?.refresh();
    }
  }), [listId, moduleName, modelName]);

  return <SolidListView ref={setListRef} key={listId} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
