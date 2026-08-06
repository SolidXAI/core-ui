import { SolidKanbanView } from "../../../../components/core/kanban/SolidKanbanView";
import type { SolidKanbanViewHandle } from "../../../../components/core/kanban/SolidKanbanView";
import { registerKanbanView, unregisterKanbanView } from "../../../../components/core/kanban/kanbanViewRegistry";
import { camelCase } from "lodash";
import { useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { storeCurrentModelViewContext } from "../../../../helpers/modelViewPersistence";
import { usePathname } from "../../../../hooks/usePathname";
import { useSearchParams } from "../../../../hooks/useSearchParams";

export function KanbanPage() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";
  const menuItemId = searchParams.get("menuItemId") || "";
  const menuItemName = searchParams.get("menuItemName") || "";
  const actionId = searchParams.get("actionId") || "";
  const actionName = searchParams.get("actionName") || "";
  const kanbanId = `page:${moduleName}:${modelName}:${menuItemId}:${menuItemName}:${actionId}:${actionName}`;

  const setKanbanRef = useCallback((handle: SolidKanbanViewHandle | null) => {
    if (handle) {
      registerKanbanView(kanbanId, handle);
      return;
    }
    unregisterKanbanView(kanbanId);
  }, [kanbanId]);

  useEffect(() => {
    const currentUrl = search ? `${pathname}?${search}` : pathname;
    storeCurrentModelViewContext(currentUrl);
  }, [pathname, search]);

  return <SolidKanbanView ref={setKanbanRef} key={kanbanId} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
