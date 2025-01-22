'use client';
import { useGenerateCodeFormoduleMutation } from "@/redux/api/moduleApi";
import { Button } from "primereact/button";


export const GenerateModuleCodeRowAction = ({ context, closeCustomRowActionPopup }: any) => {
    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeFormoduleMutation();

    const generateCodeHandler = async () => {
        const response = await generateCode({ id: context.rowData.id })
        closeCustomRowActionPopup()

    }

    return (
        <div>
            <p className="text-center">Click Ok to proceed with module code generation, please note that if the file already exists and <br></br>you have made custom changes to this file we will create a .bkp file as a backup of the existing file.</p>
            <div className="flex gap-5 justify-content-center">
                <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} />
                <Button label="Cancel" icon="pi pi-times" className='small-button' onClick={closeCustomRowActionPopup} />
            </div>
        </div >
    )
}

