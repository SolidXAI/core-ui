import { Check, X } from "lucide-react";
import { getExtensionComponent } from "../../../helpers/registry";
import { SolidButton } from "../../shad-cn-ui";


export const ListViewRowActionPopup = ({ context }: any) => {

    //Note if there is not custom component the need a api call to server 
    // GenerateModuleCode  is my custom compoennt that will trigger code generation 
    //Render dynamic lsit action contains code for dynamically rendering compoennt or retunr a fall back

    const triggerServerAction = () => {

    }

    let DynamicWidget = getExtensionComponent(context?.rowAction?.action);
    const widgetProps = {
        context: context
    }

    return (
        <div>
            {
                context?.rowAction?.action ?
                    DynamicWidget && <DynamicWidget {...widgetProps} />
                    :
                    <>
                        <h1>{context?.modelName}</h1>
                        <h1>{context?.moduleName}</h1>
                        <div className="flex justify-content-center">
                            <SolidButton className='small-button' variant="destructive" autoFocus onClick={triggerServerAction} leftIcon={<Check size={14} />}>
                                Confirm
                            </SolidButton>
                            <SolidButton className='small-button' variant="outline" onClick={() => context.closeCustomRowActionPopup()} leftIcon={<X size={14} />}>
                                Cancel
                            </SolidButton>
                        </div>
                    </>
            }
        </div>
    )
}

