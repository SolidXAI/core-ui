"use client"
import { SolidBreadcrumb } from './SolidBreadcrumb';
import { SolidFormStepper } from './SolidFormStepper';

interface Props {
    solidFormViewMetaData?: any;
    initialEntityData?: any;
}

export const SolidFormHeader = (props: Props) => {
    return (
        <div className='flex align-items-center justify-content-between'>
            <SolidBreadcrumb {...props} />
            <SolidFormStepper {...props} />
        </div>
    )
}