'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidIdKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout,data }: SolidKanbanViewFieldsParams) => {
   


    return (
        <p>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p>
    );

};

export default SolidIdKanbanField;