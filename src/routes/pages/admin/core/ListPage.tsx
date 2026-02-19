import { SolidListView } from "../../../../components/core/list/SolidListView";
import { camelCase } from "change-case";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import type { SolidListViewHandle } from "../../../../components/core/list/SolidListView";
import { registerListView, unregisterListView } from "../../../../components/core/list/listViewRegistry";

export function ListPage() {
  const params = useParams();
  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";
  const listId = `page:${moduleName}:${modelName}`;

  const setListRef = useCallback((handle: SolidListViewHandle | null) => {
    if (handle) {
      registerListView(listId, handle);
      return;
    }
    unregisterListView(listId);
  }, [listId]);

  return <SolidListView ref={setListRef} key={moduleName + modelName} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
