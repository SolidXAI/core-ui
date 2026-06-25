import { camelCase } from "lodash";
import { useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { SolidTreeViewHandle } from "../../../../components/core/tree/SolidTreeView";
import { registerTree, unregisterTree } from "../../../../components/core/tree/treeViewRegistry";
import { SolidTreeView } from "../../../../components/core/tree/SolidTreeView";
import { storeCurrentModelViewContext } from "../../../../helpers/modelViewPersistence";
import { usePathname } from "../../../../hooks/usePathname";

export function TreePage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pathname = usePathname();
  const search = searchParams.toString();

  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";
  const menuItemId = searchParams.get("menuItemId") || "";
  const menuItemName = searchParams.get("menuItemName") || "";
  const actionId = searchParams.get("actionId") || "";
  const actionName = searchParams.get("actionName") || "";

  const treeId = `page:${moduleName}:${modelName}:${menuItemId}:${menuItemName}:${actionId}:${actionName}`;

  const setTreeRef = useCallback((handle: SolidTreeViewHandle | null) => {
    if (handle) {
      registerTree(treeId, handle);
      return;
    }
    unregisterTree(treeId);
  }, [treeId]);

  useEffect(() => {
    const currentUrl = search ? `${pathname}?${search}` : pathname;
    storeCurrentModelViewContext(currentUrl);
  }, [pathname, search]);

  return <SolidTreeView ref={setTreeRef} key={moduleName + modelName + menuItemId + menuItemName + actionId + actionName} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
