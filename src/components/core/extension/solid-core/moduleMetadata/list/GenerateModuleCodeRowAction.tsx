'use client';
import { useGenerateCodeFormoduleMutation } from "@/redux/api/moduleApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useDispatch } from "react-redux";


const GenerateModuleCodeRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const dispatch = useDispatch()
    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeFormoduleMutation();


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
        const response = await generateCode({ id: event?.rowData?.id })
        console.log("response", response);
        dispatch(closePopup())
    }

    return (
        <>
            <Toast ref={toast} />
            {event?.rowData?.name != "solid-core" ?
                <div className="p-4">
                    <div className="p-dialog-header  p-0">
                        <span className="p-dialog-title">
                            Generate Module
                        </span>
                    </div>
                    <p className="text-start mt-2">Click Ok to proceed with module code generation, please note that if the file already exists and
                        you have made custom changes to this file we will create a .bkp file as a backup of the existing file.</p>
                    <div className="flex gap-3 justify-content-start">
                        <Button size="small" label="Ok" autoFocus onClick={generateCodeHandler} />
                        <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                    </div>
                </div> :
                <div className="p-4">
                    <div className="p-dialog-header p-0">
                        <span className="p-dialog-title">
                            Generate Module
                        </span>
                    </div>
                    <p className="test-start mt-2">You cannot generate code for Solid Core modules</p>
                    <div className="flex gap-3 justify-content-start">
                        {/* <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} /> */}
                        <Button size="small" label="Cancel" outlined onClick={() => dispatch(closePopup())} />
                    </div>
                </div >}
        </>
    )
}

export default GenerateModuleCodeRowAction;