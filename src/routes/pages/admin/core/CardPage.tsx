import { camelCase } from "lodash";
import { useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SolidCardView } from "../../../../components/core/card/SolidCardView";
import type { SolidCardViewHandle } from "../../../../components/core/card/SolidCardView";
import { getCardView, registerCardView, unregisterCardView } from "../../../../components/core/card/cardViewRegistry";
import { storeCurrentModelViewContext } from "../../../../helpers/modelViewPersistence";
import { usePathname } from "../../../../hooks/usePathname";
import { useSearchParams } from "../../../../hooks/useSearchParams";
import { isMatchingAdminViewRefresh, ADMIN_VIEW_REFRESH_REQUESTED, type AdminViewRefreshRequest } from "../../../../helpers/adminViewRefresh";
import { eventBus } from "../../../../helpers/eventBus";

export function CardPage() {
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
  const cardId = `page:${moduleName}:${modelName}:${menuItemId}:${menuItemName}:${actionId}:${actionName}`;

  const setCardRef = useCallback((handle: SolidCardViewHandle | null) => {
    if (handle) {
      registerCardView(cardId, handle);
      return;
    }
    unregisterCardView(cardId);
  }, [cardId]);

  useEffect(() => {
    const currentUrl = search ? `${pathname}?${search}` : pathname;
    storeCurrentModelViewContext(currentUrl);
  }, [pathname, search]);

  useEffect(() => eventBus.on<AdminViewRefreshRequest>(ADMIN_VIEW_REFRESH_REQUESTED, (request) => {
    if (isMatchingAdminViewRefresh(request, { moduleName, modelName, viewName: "card" })) {
      getCardView(cardId)?.refresh();
    }
  }), [cardId, moduleName, modelName]);

  return <SolidCardView ref={setCardRef} key={cardId} {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
