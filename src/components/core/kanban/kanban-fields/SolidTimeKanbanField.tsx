'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidTimeKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout,data }: SolidKanbanViewFieldsParams) => {
   
    return (
        <p className='m-0'>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p>
    );

};

export default SolidTimeKanbanField;