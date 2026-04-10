import { closePopup } from "../../../../../../redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { kebabCase } from "lodash";
import { createSolidEntityApi } from "../../../../../../redux/api/solidEntityApi";
import { ERROR_MESSAGES } from "../../../../../../constants/error-messages";
import { SolidButton, SolidCheckbox } from "../../../../../shad-cn-ui";


const DeleteModelRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const dispatch = useDispatch();
    const entityApi = createSolidEntityApi(event.params.modelName);
    const {useDeleteSolidEntityMutation} = entityApi;
    const [deleteSolidSingleEntiry] = useDeleteSolidEntityMutation()

    const deleteModelHandler = async () => {
        try {
            const res: any = await deleteSolidSingleEntiry(event.rowData.id);
            
            // console.log('delete model res', res);
            if (res.error) {
                // handle backend or RTK error object
                const message =
                    res.error?.data?.message ||
                    res.error?.error ||
                    ERROR_MESSAGES.ERROR_OCCURED;
                dispatch(showToast({ severity: 'error', summary: ERROR_MESSAGES.DELETE_FAIELD, detail: message }));
            } else {
                dispatch(showToast({ severity: 'success', summary: ERROR_MESSAGES.MODEL_DELETE, detail: ERROR_MESSAGES.MODEL_DELETE_SUCCESSFULLY(event.rowData.singularName) }));
                dispatch(closePopup());
            }
        } catch (err: any) {
            console.error("catch error", err);
            dispatch(showToast({ severity: 'error', summary: ERROR_MESSAGES.ERROR, detail: ERROR_MESSAGES.NETWORK_OR_SERVER_ERROR }));
        }
    }

    const rows = [
        { file: `${kebabCase(event.rowData.singularName)}.entity.ts`, description: 'The TypeORM entity definition for this model. Deleting it removes the model’s schema mapping', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.create.dto.ts`, description: 'DTO defining the payload for creating a new record of this model', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.update.dto.ts`, description: 'DTO defining the payload for updating an existing record of this model', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.repository.ts`, description: 'Custom repository encapsulating database operations for this model', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.service.ts`, description: 'Service layer containing business logic and interactions for this model', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.controller.ts`, description: 'Controller exposing API endpoints related to this model', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.module.ts`, description: 'Module declaration that wires together the controller, service, and repository. All imports and references to the deleted model are removed automatically', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}-metadata.json`, description: 'Remove references to this model in the model metadata, menu, action & view sections', intervention: 'Automatic' },
        { file: '-', description: 'Drop database table. Removes the database table from the DB, this is a very risky step. Best to review all relations to other models etc and then do this manually', intervention: 'Manual (X)', manual: true },
    ];



    return (
        <div className="solid-delete-model-popup">
            <div className="solid-filter-dialog-head solid-delete-model-popup__head">
                <div>
                    <h3 className="solid-filter-dialog-title">Delete Model</h3>
                    <p className="solid-filter-dialog-subtitle m-0">
                        Review the impacted files carefully before applying this delete action.
                    </p>
                </div>
            </div>
            <div className="solid-filter-dialog-sep" />
            <div className="solid-filter-dialog-body solid-delete-model-popup__body">
                <p className="solid-delete-model-popup__intro">
                    Deleting a model should be done carefully. The following files will be impacted as part of deleting this model.
                </p>

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
                                <tr key={`${row.file}-${row.intervention}`}>
                                    <td className="solid-delete-model-popup__file">{row.file}</td>
                                    <td>{row.description}</td>
                                    <td className={row.manual ? "solid-delete-model-popup__intervention is-manual" : "solid-delete-model-popup__intervention"}>
                                        {row.intervention}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="solid-delete-model-popup__confirm">
                    <SolidCheckbox
                        id="delete-model-confirmation"
                        name="confirm"
                        checked={isConfirmed}
                        onChange={() => setIsConfirmed(!isConfirmed)}
                        label="I confirm that #9 (drop database table) will be done by me manually after the automatic steps above are applied."
                    />
                </div>

                <div className="solid-delete-model-popup__actions">
                    <SolidButton size="small" disabled={!isConfirmed} autoFocus onClick={deleteModelHandler}>
                        Apply
                    </SolidButton>
                    <SolidButton size="small" variant="outline" onClick={() => dispatch(closePopup())}>
                        Cancel
                    </SolidButton>
                </div>
            </div>
        </div>
    )
}

export default DeleteModelRowAction;
