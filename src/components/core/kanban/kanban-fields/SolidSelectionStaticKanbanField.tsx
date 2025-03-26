'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';


const SolidSelectionStaticKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout,data }: SolidKanbanViewFieldsParams) => {

   

    return (
      <p>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p>
    );
};

export default SolidSelectionStaticKanbanField;