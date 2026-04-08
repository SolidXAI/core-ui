
import { SolidBreadcrumb } from './SolidBreadcrumb';
import { SolidFormStepper } from './SolidFormStepper';

interface Props {
    solidFormViewMetaData?: any;
    initialEntityData?: any;
    modelName?: any;
    id?: any,
    solidWorkflowFieldValue?: any
    setSolidWorkflowFieldValue?: any
    onStepperUpdate?: () => void
}

export const SolidFormHeader = (props: Props) => {
    const { solidFormViewMetaData, id } = props;
    return (
        <div className='flex flex-column gap-2 align-items-start xl:flex-row xl:align-items-center justify-content-between solid-dynamic-breadcrumb-stepper'>
            {/* <SolidBreadcrumb {...props} /> */}
            <div></div>
            {solidFormViewMetaData?.data?.solidFormViewWorkflowData.length > 0 &&
                <SolidFormStepper {...props} />
            }
        </div>
    )
}