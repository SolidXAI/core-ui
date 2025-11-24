'use client';
import { useGenerateCodeForModelMutation } from "@/redux/api/modelApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Toast } from 'primereact/toast';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { kebabCase } from "lodash";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { ERROR_MESSAGES } from "@/constants/error-messages";


const DeleteModelRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [errorState, setErrorState] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const dispatch = useDispatch();
    const entityApi = createSolidEntityApi(event.params.modelName);
    const {useDeleteSolidEntityMutation} = entityApi;
    const [deleteSolidSingleEntiry, { 
        isError:isSolidEntitiesDeleteError , 
    }] = useDeleteSolidEntityMutation()

    const toast = useRef<Toast>(null);
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const deleteModelHandler = async () => {
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
        { file: `${kebabCase(event.rowData.singularName)}.entity.ts`, description: `${kebabCase(event.rowData.singularName)}.entity.ts needs to be deleted.`, intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.create.dto.ts`, description: `${kebabCase(event.rowData.singularName)}.entity.ts needs to be deleted.`, intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.update.dto.ts`, description: `${kebabCase(event.rowData.singularName)}.entity.ts needs to be deleted.`, intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.repository.ts`, description: `${kebabCase(event.rowData.singularName)}.entity.ts needs to be deleted.`, intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.service.ts`, description: `${kebabCase(event.rowData.singularName)}.entity.ts needs to be deleted.`, intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.controller.ts`, description: `${kebabCase(event.rowData.singularName)}.entity.ts needs to be deleted.`, intervention: 'Automatic' },
        { file: `${kebabCase(event.rowData.singularName)}.module.ts`, description: 'Remove all references and imports of the above files.', intervention: 'Manual (X)', manual: true },
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
                    <Button size="small" label="Apply" disabled={!isConfirmed} autoFocus onClick={deleteModelHandler} />
                    <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                </div>
            </div>
        </div>
    )
}

export default DeleteModelRowAction;
