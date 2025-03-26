'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidShortTextKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout,data }: SolidKanbanViewFieldsParams) => {     
    const renderMode = fieldLayout?.attrs?.renderMode ? fieldLayout?.attrs?.renderMode: "text" ;
    return (
        <>
        {renderMode === "text" ? 
            <p>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p> 
            :
            <img src={`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/${data[fieldMetadata.name]}`}></img>
        }
        </>
    );

};

export default SolidShortTextKanbanField;