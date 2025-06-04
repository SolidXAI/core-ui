'use client';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useGenerateCodeForModelMutation } from "@/redux/api/modelApi";
import { useSeederMutation } from "@/redux/api/testApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Toast } from 'primereact/toast';


const GenerateModelCodeRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
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

    const [triggerSeeder, { data, isLoading, isSuccess: isSeederSuccess, isError: isSeederError }] = useSeederMutation();

    // Utitlity to track if solid-api is up
    const [isPinging, setIsPinging] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const pingBackendWithRetry = async (retries = 5, delay = 500): Promise<boolean> => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/ping`);
                console.log("ping response", res);

                if (res.ok)
                    return true;
            } catch (e) {
                // ignore and retry
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        return false;
    };


    const generateCodeHandler = async () => {
        const response = await generateCode({ id: event?.rowData?.id });
        console.log("response generate code handler", response);
        setIsGenerating(true);
    }

    useEffect(() => {
        const runSeederIfBackendAlive = async () => {
            if (isGenerateCodeSuceess) {
                console.log("isGenerateCodeSuceess", isGenerateCodeSuceess);
                setIsPinging(true);
                const isAlive = await pingBackendWithRetry(10, 500);
                console.log("isAlive", isAlive);
                setIsPinging(false);

                if (isAlive) {
                    await triggerSeeder("ModuleMetadataSeederService");

                } else {
                    showToast("error", "Backend Unavailable", "Seeder not triggered. Could not reach backend.");
                }
            }
        };
        setTimeout(() => {
            runSeederIfBackendAlive();
        }, 5000);
    }, [isGenerateCodeSuceess]);
    useEffect(() => {
        if (isSeederSuccess) {
            console.log("isSeederSuccess", data);
            showToast("success", "Code Generated Successfully", "Code Generated Successfully");
            setIsGenerating(false);
            dispatch(closePopup());
        }
        if (isSeederError) {
            console.log("isSeederError", isSeederError);
            showToast("error", "Seeder Error", "Could not run seeder. Please try again.");
            setIsGenerating(false);
        }
    }, [isSeederSuccess])



    return (
        <>
            {isGenerating ?
                <>
                    <Toast ref={toast} />
                    <div className="flex flex-column align-items-center justify-content-center" style={{ padding: '2rem' }}>
                        <ProgressSpinner />
                        <p className="mt-3">Waiting for backend...</p>
                    </div>
                </>
                :
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
                                <p className="">Click Ok to proceed with model code generation, please note that if the file already exists and you have made custom changes to this file we will create a .bkp file as a backup of the existing file.</p>
                                <p>Below is the list of files that will be created </p>
                                <ul>
                                    <li>Model Entity File</li>
                                    <li>Model Repository</li>
                                    <li>Model Controller File</li>
                                    <li>Model Service File</li>
                                    <li>Model Create and Update Dto files</li>
                                </ul>
                                <div className="flex gap-3 justify-content-start">
                                    <Button size="small" label="Ok" autoFocus onClick={generateCodeHandler} />
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
            }

        </>
    )
}

export default GenerateModelCodeRowAction;
