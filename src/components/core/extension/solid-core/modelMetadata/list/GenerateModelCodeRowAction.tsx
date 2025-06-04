'use client';
import { useGenerateCodeForModelMutation } from "@/redux/api/modelApi";
import { useSeederMutation } from "@/redux/api/testApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Toast } from 'primereact/toast';


const GenerateModelCodeRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const dispatch = useDispatch();
    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeForModelMutation();

    const [triggerSeeder, { data }] = useSeederMutation();

    const toast = useRef<Toast>(null);
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };


    const generateCodeHandler = async () => {
        const response = await generateCode({ id: event?.rowData?.id });

        if ((response as any)?.data?.statusCode === 200) {
            showToast("success", "Generated", "Code Generated Successfully");
            dispatch(closePopup());
        } else {
            const errorMessage = (response as any)?.data?.error || "Something went wrong";
            showToast("error", "Error", errorMessage); // ✅ Only string is passed
        }

        console.log("response", response);
    }

    useEffect(() => {
        const seeder = async () => {
            if (isGenerateCodeSuceess) {
                await triggerSeeder("ModuleMetadataSeederService");
            }
        }
        seeder();
    }, [isGenerateCodeSuceess])

    return (
        <>
            <Toast ref={toast} />
            {event?.rowData?.module?.name != "solid-core" ?
                <div className="">
                    <div className="p-dialog-header secondary-border-bottom py-3" style={{ background: 'var(--solid-light-grey)' }}>
                        <span className="p-dialog-title">
                            Generate Model
                        </span>
                    </div>
                    <div className="px-4 pb-4 pt-3">
                        <p className="">Click <strong>Generate</strong> to proceed with model code generation, please note that if the file already exists and you have made custom changes to this file we will create a .bkp file as a backup of the existing file.</p>
                        <p>Below is the list of files that will be created </p>
                        <ul>
                            <li>Model Entity File</li>
                            <li>Model Repository</li>
                            <li>Model Controller File</li>
                            <li>Model Service File</li>
                            <li>Model Create and Update Dto files</li>
                        </ul>
                        <div className="flex gap-3 justify-content-start">
                            <Button size="small" label="Generate" autoFocus onClick={generateCodeHandler} />
                            <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                        </div>
                    </div>
                </div > :
                <div className="">
                    <div className="p-dialog-header secondary-border-bottom py-3" style={{ background: 'var(--solid-light-grey)' }}>
                        <span className="p-dialog-title">
                            Generate Model
                        </span>
                    </div>
                    <div className="px-4 pb-4 pt-3">
                        <p className="">You cannot generate code for Solid Core models</p>
                        <div className="flex gap-3 justify-content-start">
                            {/* <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} /> */}
                            <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                        </div>
                    </div>
                </div>
            }
        </>
    )
}

export default GenerateModelCodeRowAction;
