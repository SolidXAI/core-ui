'use client';
import { useGenerateCodeForModelMutation } from "@/redux/api/modelApi";
import { Button } from "primereact/button";


const GenerateModelCodeRowAction = ({ context }: any) => {

    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeForModelMutation();


    const generateCodeHandler = async () => {
        const response = await generateCode({ id: context.rowData.id })
        context.closeListViewRowActionPopup();
        console.log("response", response);
    }

    return (
        <div>
            <p className="">Click Ok to proceed with model code generation, please note that if the file already exists and <br></br>you have made custom changes to this file we will create a .bkp file as a backup of the existing file.</p>
            <p>Below is the list of files that will be created </p>
            <ul>
                <li>Model Entity File</li>
                <li>Model Controller File</li>
                <li>Model Service File</li>
                <li>Model Create and Update Dto files</li>
            </ul>
            <div className="flex gap-5 justify-content-center">
                <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} />
                <Button label="Cancel" icon="pi pi-times" className='small-button' onClick={() => context.closeListViewRowActionPopup()} />
            </div>
        </div >
    )
}

export default GenerateModelCodeRowAction;
