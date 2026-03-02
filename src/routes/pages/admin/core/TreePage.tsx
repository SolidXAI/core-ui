import { camelCase } from "change-case";
import { useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { SolidTreeViewHandle } from "../../../../components/core/tree/SolidTreeView";
import { registerTree, unregisterTree } from "../../../../components/core/tree/treeViewRegistry";
import { SolidTreeView } from "@/components/core/tree/SolidTreeView";

export function TreePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

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

  return <SolidTreeView ref={setTreeRef} key={moduleName + modelName + menuItemId + menuItemName + actionId + actionName} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
