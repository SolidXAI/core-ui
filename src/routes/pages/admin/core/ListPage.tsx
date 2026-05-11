import { SolidListView } from "../../../../components/core/list/SolidListView";
import { camelCase } from "lodash";
import { useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { SolidListViewHandle } from "../../../../components/core/list/SolidListView";
import { registerListView, unregisterListView } from "../../../../components/core/list/listViewRegistry";

export function ListPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

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

  return <SolidListView ref={setListRef} key={listId} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
