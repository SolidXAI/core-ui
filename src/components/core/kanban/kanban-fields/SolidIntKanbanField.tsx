'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';
import { InputText } from 'primereact/inputtext';

const SolidIntKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout, data }: SolidKanbanViewFieldsParams) => {
    const formatFileSize = (size: number) => {
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };
    return (
        fieldMetadata?.name === "fileSize" ?
            <p className='m-0 text-sm'>Size : {data && data[fieldMetadata.name] ? `${formatFileSize(data[fieldMetadata.name])}` : ""}</p>
            :
            <p className='m-0'>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}` : ""}</p>
    );

};

export default SolidIntKanbanField;