import { camelCase } from "change-case";
import { useParams } from "react-router-dom";
import { SolidCardView } from "../../../../components/core/card/SolidCardView";

export function CardPage() {
  const params = useParams();
  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";
  return <SolidCardView {...params} embeded={false} moduleName={moduleName} modelName={modelName} />;
}
