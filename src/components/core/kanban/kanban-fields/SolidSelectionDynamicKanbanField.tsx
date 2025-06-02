'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidSelectionDynamicKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout,data }: SolidKanbanViewFieldsParams) => {
 

    return (
        <p className='m-0'>{fieldLayout?.attrs?.showLabel !== false && fieldLayout?.attrs?.label ? `${fieldLayout?.attrs?.label} : ` : ""}{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p>
    );

};

export default SolidSelectionDynamicKanbanField;