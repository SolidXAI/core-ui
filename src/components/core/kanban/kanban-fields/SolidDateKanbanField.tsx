'use client';
import { Calendar } from 'primereact/calendar';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidDateKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout,data }: SolidKanbanViewFieldsParams) => {
    
    return (
        <p>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p>

    );

};

export default SolidDateKanbanField;