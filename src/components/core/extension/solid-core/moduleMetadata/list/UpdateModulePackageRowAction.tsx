import { useDispatch } from "react-redux";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { ModulePackageImportContent } from "../../../../module/ModulePackageDialog";
import { refreshMatchingListViews } from "./ModuleImportListHeaderAction";

const UpdateModulePackageRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
  const dispatch = useDispatch();
  const moduleName = String(event?.rowData?.name || "").trim();

  return (
    <ModulePackageImportContent
      targetModuleName={moduleName || null}
      onClose={() => dispatch(closePopup())}
      onImported={() => refreshMatchingListViews(event?.params?.moduleName, event?.params?.modelName)}
    />
  );
};

export default UpdateModulePackageRowAction;
