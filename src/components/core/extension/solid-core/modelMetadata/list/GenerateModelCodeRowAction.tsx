'use client';
import { useGenerateCodeForModelMutation } from "@/redux/api/modelApi";
import { useSeederMutation } from "@/redux/api/testApi";
import { closePopup } from "@/redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { useEffect } from "react";
import { useDispatch } from "react-redux";


const GenerateModelCodeRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const dispatch = useDispatch();
    const [
        generateCode,
        { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess, isError: isGenerateCodeError, error: generateCodeError, data: generateCodeData },
    ] = useGenerateCodeForModelMutation();

    const [triggerSeeder, { data }] = useSeederMutation();


    const generateCodeHandler = async () => {
        const response = await generateCode({ id: event?.rowData?.id });
        dispatch(closePopup())
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
            {event?.rowData?.module?.name != "solid-core" ?
                <div className="p-2">
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
                        <Button label="Cancel" icon="pi pi-times" className='small-button' onClick={() => dispatch(closePopup())} />
                    </div>
                </div > :
                <div className="p-2">
                    <p className="">You cannot generate code for Solid Core models</p>
                    <div className="flex gap-5 justify-content-center">
                        {/* <Button label="Ok" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={generateCodeHandler} /> */}
                        <Button label="Close" icon="pi pi-times" className='small-button' onClick={() => dispatch(closePopup())} />
                    </div>
                </div >
            }
        </>
    )
}

export default GenerateModelCodeRowAction;
