"use client"
import { SolidBreadcrumb } from './SolidBreadcrumb';
import { SolidFormStepper } from './SolidFormStepper';

interface Props {
    solidFormViewMetaData?: any;
    initialEntityData?: any;
    modelName?: any;
    id?:any,
    solidWorkflowFieldValue?: any
    setSolidWorkflowFieldValue?: any
}

export const SolidFormHeader = (props: Props) => {
    const { solidFormViewMetaData } = props;
    return (
        <div className='flex align-items-center justify-content-between solid-dynamic-breadcrumb-stepper'>
            <SolidBreadcrumb {...props} />
            {solidFormViewMetaData?.data?.solidFormViewWorkflowData.length > 0 &&
                <SolidFormStepper {...props} />
            }
        </div>
    )
}