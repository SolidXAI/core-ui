'use client';

import { Checkbox } from "primereact/checkbox";
import { SolidKanbanViewFieldsParams } from "../SolidKanbanViewFields";

const SolidBooleanKanbanField = ({ solidKanbanViewMetaData, fieldMetadata,fieldLayout, data }: SolidKanbanViewFieldsParams) => {

    return (
        <p>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}`: ""}</p>
    );
};

export default SolidBooleanKanbanField;