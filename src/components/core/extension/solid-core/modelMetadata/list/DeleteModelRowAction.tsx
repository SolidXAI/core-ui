'use client';
import { useGenerateCodeForModelMutation } from "@/redux/api/modelApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Toast } from 'primereact/toast';
import styles from './deleteModelRowAction.module.css';


const DeleteModelRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const dispatch = useDispatch();
    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeForModelMutation();


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
        const response: any = await generateCode({ id: event?.rowData?.id });
    }


    const rows = [
        { file: '<singularName>.entity.ts', description: 'The TypeORM model that needs to be deleted.', intervention: 'Automatic' },
        { file: '<singularName>.create.dto.ts', description: 'The TypeORM model that needs to be deleted.', intervention: 'Automatic' },
        { file: '<singularName>.update.dto.ts', description: 'The TypeORM model that needs to be deleted.', intervention: 'Automatic' },
        { file: '<singularName>.repository.ts', description: 'The TypeORM model that needs to be deleted.', intervention: 'Automatic' },
        { file: '<singularName>.service.ts', description: 'The TypeORM model that needs to be deleted.', intervention: 'Automatic' },
        { file: '<singularName>.controller.ts', description: 'The TypeORM model that needs to be deleted.', intervention: 'Automatic' },
        { file: '<moduleName>.module.ts', description: 'Remove all references and imports of the above files.', intervention: 'Manual (X)', manual: true },
        { file: '<moduleName>-metadata.json', description: 'Remove references to this model in the model metadata, menu, action & view sections.', intervention: 'Automatic' },
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
                <div style={{ padding: '20px', fontFamily: 'Arial' }}>
                    <p>
                        Deleting a model should be done carefully. The below files will be impacted as part of deleting a model:
                    </p>

                    <table className="model-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Description</th>
                                <th>Intervention</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.file}</td>
                                    <td>{row.description}</td>
                                    <td className={row.manual ? 'manual' : ''}>{row.intervention}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>


                    <div style={{ marginBottom: '20px' }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={isConfirmed}
                                onChange={() => setIsConfirmed(!isConfirmed)}
                                style={{ marginRight: '8px' }}
                            />
                            I confirm that #7 &amp; #9 will be done by me manually after the automatic steps above are applied.
                        </label>
                    </div>


                </div>


                <div className="flex gap-3 justify-content-start">
                    <Button size="small" label="Apply" disabled={!isConfirmed} autoFocus onClick={deleteModelHandler} />
                    <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                </div>
            </div>
        </div >
    )
}

export default DeleteModelRowAction;
