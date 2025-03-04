'use client';
import { Button } from "primereact/button"
import { LoadDynamicJsxComponent } from "../common/LoadDynamicJsxComponent";


export const ListViewRowActionPopup = ({ context }: any) => {

    //Note if there is not custom component the need a api call to server 
    // GenerateModuleCode  is my custom compoennt that will trigger code generation 
    //Render dynamic lsit action contains code for dynamically rendering compoennt or retunr a fall back

    const triggerServerAction = () => {

    }

    return (
        <div>
            {
                context?.rowAction?.action?.customComponent ?
                    <LoadDynamicJsxComponent context={context}></LoadDynamicJsxComponent>
                    :
                    <>
                        <h1>{context?.modelName}</h1>
                        <h1>{context?.moduleName}</h1>
                        <div className="flex justify-content-center">
                            <Button label={context?.rowAction?.action?.confirmBtnLabel} icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={triggerServerAction} />
                            <Button label={context?.rowAction?.action?.cancelBtnLabel} icon="pi pi-times" className='small-button' onClick={() => context.closeCustomRowActionPopup()} />
                        </div>
                    </>
            }
        </div>
    )
}


