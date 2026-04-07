import { camelCase } from "change-case";
import SolidFormLayouts from "../../../../components/core/form/SolidFormLayouts";
import { useParams } from "react-router-dom";

export function FormPage() {
  const params = useParams();
  const moduleName = params.moduleName || "";
  const modelName = params.modelName ? camelCase(params.modelName) : "";
  const id = params.id || "";
  const formId = `page:${moduleName}:${modelName}:${id}`;

  return <SolidFormLayouts key={formId} params={params} />;
}
