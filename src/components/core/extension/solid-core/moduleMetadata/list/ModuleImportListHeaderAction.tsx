import { useDispatch } from "react-redux";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { getListView, getRegisteredListViewIds } from "../../../../list/listViewRegistry";
import { ModulePackageImportContent } from "../../../../module/ModulePackageDialog";

type ModuleImportListHeaderActionProps = {
  params?: {
    moduleName?: string;
    modelName?: string;
  };
  resumeTransactionKey?: string | null;
  autoResume?: boolean;
};

function refreshMatchingListViews(moduleName = "solid-core", modelName = "moduleMetadata") {
  const prefix = `page:${moduleName}:${modelName}:`;

  getRegisteredListViewIds()
    .filter((listId) => listId.startsWith(prefix))
    .forEach((listId) => {
      getListView(listId)?.refresh();
    });
}

export function ModuleImportListHeaderAction({ params, resumeTransactionKey, autoResume }: ModuleImportListHeaderActionProps) {
  const dispatch = useDispatch();

  return (
    <ModulePackageImportContent
      initialTransactionKey={resumeTransactionKey}
      autoResume={autoResume}
      onClose={() => dispatch(closePopup())}
      onImported={() => refreshMatchingListViews(params?.moduleName, params?.modelName)}
    />
  );
}
