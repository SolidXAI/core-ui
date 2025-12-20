'use client';
import { SolidCircularLoader } from "@/components/core/common/SolidLoaders/SolidCircularLoader";
import { ERROR_MESSAGES } from "@/constants/error-messages";
import { useGetModelsQuery, useLazyGetModelsQuery } from "@/redux/api/modelApi";
import { useGenerateCodeFormoduleMutation } from "@/redux/api/moduleApi";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useSeederMutation } from "@/redux/api/solidServiceApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { kebabCase } from "lodash";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

const DeleteModuleRowAction = (event: SolidListRowdataDynamicFunctionProps) => {

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [errorState, setErrorState] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const dispatch = useDispatch();
    const entityApi = createSolidEntityApi("moduleMetadata");
    const { useDeleteSolidEntityMutation } = entityApi;

    const [deleteSolidSingleEntiry, {
        isError: isSolidEntitiesDeleteError,
    }] = useDeleteSolidEntityMutation()

    const queryString = `filters[$and][0][$or][0][module][$in][0]=${event?.rowData?.id}`;
    const { data: models, isLoading: getModelsLoading, error } = useGetModelsQuery(queryString);
    console.log("models", models);


    const toast = useRef<Toast>(null);
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const deleteModuleHandler = async () => {
        setIsDeleting(true);
        setErrorState(null);
        try {
            const res: any = await deleteSolidSingleEntiry(event.rowData.id)
            // console.log('delete model res', res);
            setErrorState(res.error || null);
            if (res.error) {
                // handle backend or RTK error object
                const message =
                    res.error?.data?.message ||
                    res.error?.error ||
                    ERROR_MESSAGES.ERROR_OCCURED;
                setErrorState(message);
                showToast('error', ERROR_MESSAGES.DELETE_FAIELD, message);
            } else {
                showToast('success', ERROR_MESSAGES.MODEL_DELETE, ERROR_MESSAGES.MODEL_DELETE_SUCCESSFULLY(event.rowData.singularName));
                dispatch(closePopup());
            }
        } catch (err: any) {
            console.error(ERROR_MESSAGES.DELETE_ERROR, err);
            setErrorState(err.message || ERROR_MESSAGES.NETWORK_ERROR);
            showToast('error', ERROR_MESSAGES.ERROR, ERROR_MESSAGES.NETWORK_OR_SERVER_ERROR);
        } finally {
            setIsDeleting(false);
        }
    }

    const rows = [
        { file: `${kebabCase(event.rowData.singularName)}.entity.ts`, description: 'The TypeORM entity definition for this model. Deleting it removes the model’s schema mapping.', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.create.dto.ts`, description: 'DTO defining the payload for creating a new record of this model', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.update.dto.ts`, description: 'DTO defining the payload for updating an existing record of this model.', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.repository.ts`, description: 'Custom repository encapsulating database operations for this model.', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.service.ts`, description: 'Service layer containing business logic and interactions for this model.', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.controller.ts`, description: 'Controller exposing API endpoints related to this model.', intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.module.ts`, description: 'Module declaration that wires together the controller, service, and repository. All references to the deleted model must be removed here', intervention: 'Manual (X)', manual: true },
        { file: `${kebabCase(event.rowData.singularName)}-metadata.json`, description: 'Remove references to this model in the model metadata, menu, action & view sections.', intervention: 'Automatic' },
        { file: '-', description: 'Drop database table. Removes the database table from the DB, this is a very risky step. Best to review all relations to other models etc and then do this manually.', intervention: 'Manual (X)', manual: true },
    ];


    return (
        <div className="">
            <div className="p-dialog-header secondary-border-bottom py-3" style={{ background: 'var(--solid-light-grey)' }}>
                <span className="p-dialog-title">
                    Delete Model
                </span>
            </div>
            <div className="px-4 pb-4 pt-3">
                <div>
                    <p className="form-field-label font-medium">
                        Deleting a model should be done carefully. The below files will be impacted as part of deleting a model:
                    </p>
                    <DataTable value={rows} size="small">
                        <Column field="file" header="File Name" />
                        <Column field="description" header="Description" />
                        <Column field="intervention" header="Intervention" />
                    </DataTable>
                    <div className="my-4">
                        <div className="flex align-items-center">
                            <Checkbox
                                inputId="confirmation"
                                name="confirm"
                                checked={isConfirmed}
                                onChange={() => setIsConfirmed(!isConfirmed)} />
                            <label htmlFor="confirmation" className="ml-2 form-field-label">
                                I confirm that #7 &amp; #9 will be done by me manually after the automatic steps above are applied.
                            </label>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 justify-content-start">
                    <Button size="small" label="Apply" disabled={!isConfirmed} autoFocus onClick={deleteModuleHandler} />
                    <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                </div>
            </div>
        </div>
    )
}

export default DeleteModuleRowAction;