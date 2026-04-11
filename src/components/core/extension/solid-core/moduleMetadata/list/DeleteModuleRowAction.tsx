import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { kebabCase } from "lodash";
import { AlertTriangle } from "lucide-react";
import { ERROR_MESSAGES } from "../../../../../../constants/error-messages";
import { useGetModelsQuery } from "../../../../../../redux/api/modelApi";
import { createSolidEntityApi } from "../../../../../../redux/api/solidEntityApi";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { SolidButton } from "../../../../../shad-cn-ui";

const DeleteModuleRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allowDelete, setAllowDelete] = useState(false);

  const dispatch = useDispatch();
  const entityApi = createSolidEntityApi("moduleMetadata");
  const { useDeleteSolidEntityMutation } = entityApi;
  const [deleteSolidSingleEntiry] = useDeleteSolidEntityMutation();

  const queryString = `filters[$and][0][$or][0][module][$in][0]=${event?.rowData?.id}`;
  const { data: models, isLoading: getModelsLoading } = useGetModelsQuery(queryString);

  useEffect(() => {
    setAllowDelete(Boolean(models && models.meta.totalRecords === 0));
  }, [models]);

  const deleteModuleHandler = async () => {
    setIsDeleting(true);
    setErrorState(null);

    try {
      const res: any = await deleteSolidSingleEntiry(event.rowData.id);

      if (res.error) {
        const message =
          res.error?.data?.message ||
          res.error?.error ||
          ERROR_MESSAGES.ERROR_OCCURED;

        setErrorState(message);
        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.DELETE_FAIELD, detail: message }));
      } else {
        dispatch(
          showToast({
            severity: "success",
            summary: ERROR_MESSAGES.MODEL_DELETE,
            detail: ERROR_MESSAGES.MODEL_DELETE_SUCCESSFULLY(event.rowData.singularName),
          })
        );
        dispatch(closePopup());
      }
    } catch (err: any) {
      console.error(ERROR_MESSAGES.DELETE_ERROR, err);
      const message = err.message || ERROR_MESSAGES.NETWORK_ERROR;
      setErrorState(message);
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.ERROR, detail: ERROR_MESSAGES.NETWORK_OR_SERVER_ERROR }));
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = [
    {
      file: `${kebabCase(event.rowData.name)}.module.ts`,
      description: "Delete the module file.",
      intervention: "Automatic",
    },
    {
      file: `${kebabCase(event.rowData.name)}-metadata.json`,
      description: "Remove the module metadata JSON file.",
      intervention: "Automatic",
    },
  ];

  return (
    <div className="solid-delete-model-popup solid-delete-module-popup">
      <div className="solid-filter-dialog-head solid-delete-model-popup__head">
        <div>
          <h3 className="solid-filter-dialog-title">Delete Module</h3>
          <p className="solid-filter-dialog-subtitle m-0">
            Review the affected files and confirm there are no linked models before deleting this module.
          </p>
        </div>
      </div>
      <div className="solid-filter-dialog-sep" />
      <div className="solid-filter-dialog-body solid-delete-model-popup__body">
        {getModelsLoading ? (
          <p className="solid-delete-model-popup__intro">Checking whether this module still has linked models.</p>
        ) : allowDelete ? (
          <p className="solid-delete-model-popup__intro">
            Deleting a module should be done carefully. The following files will be removed as part of deleting this module.
          </p>
        ) : (
          <div className="solid-delete-module-popup__notice">
            <AlertTriangle size={16} />
            <span>This module still has models associated with it. Delete those models first before deleting the module.</span>
          </div>
        )}

        <div className="solid-delete-model-popup__table-wrap">
          <table className="solid-delete-model-popup__table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Description</th>
                <th>Intervention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.file}>
                  <td className="solid-delete-model-popup__file">{row.file}</td>
                  <td>{row.description}</td>
                  <td className="solid-delete-model-popup__intervention">{row.intervention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errorState ? <div className="solid-delete-module-popup__error">{errorState}</div> : null}

        <div className="solid-delete-model-popup__actions">
          {allowDelete ? (
            <SolidButton size="small" autoFocus loading={isDeleting} disabled={getModelsLoading || isDeleting} onClick={deleteModuleHandler}>
              Apply
            </SolidButton>
          ) : null}
          <SolidButton size="small" variant="outline" onClick={() => dispatch(closePopup())}>
            {allowDelete ? "Cancel" : "Close"}
          </SolidButton>
        </div>
      </div>
    </div>
  );
};

export default DeleteModuleRowAction;
