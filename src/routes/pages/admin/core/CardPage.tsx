import { camelCase } from "lodash";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { SolidCardView } from "../../../../components/core/card/SolidCardView";
import { storeCurrentModelViewContext } from "../../../../helpers/modelViewPersistence";
import { usePathname } from "../../../../hooks/usePathname";
import { useSearchParams } from "../../../../hooks/useSearchParams";

export function CardPage() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";

  useEffect(() => {
    const currentUrl = search ? `${pathname}?${search}` : pathname;
    storeCurrentModelViewContext(currentUrl);
  }, [pathname, search]);

  return <SolidCardView {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
