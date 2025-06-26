'use client';
import { useGenerateCodeFormoduleMutation } from "@/redux/api/moduleApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { useDispatch } from "react-redux";


const GenerateModuleCodeRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const dispatch = useDispatch()
    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeFormoduleMutation();

    const generateCodeHandler = async () => {
        const response = await generateCode({ id: event?.rowData?.id })
        dispatch(closePopup())
    }

    return (
        <>
            {event?.rowData?.name != "solid-core" ? <div>
                <p className="text-center">Click Ok to proceed with module code generation, please note that if the file already exists and <br></br>you have made custom changes to this file we will create a .bkp file as a backup of the existing file.</p>
                <div className="flex gap-5 justify-content-center">
                    <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} />
                    <Button label="Cancel" icon="pi pi-times" className='small-button' onClick={() => dispatch(closePopup())} />
                </div>
            </div> :
                <div>
                    <p className="">You cannot generate code for Solid Core modules</p>
                    <div className="flex gap-5 justify-content-center">
                        {/* <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} /> */}
                        <Button label="Close" icon="pi pi-times" className='small-button' onClick={() => dispatch(closePopup())} />
                    </div>
                </div >}
        </>
    )
}

export default GenerateModuleCodeRowAction;