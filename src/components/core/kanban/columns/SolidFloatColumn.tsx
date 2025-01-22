"use client";
import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import SolidIntColumn from './SolidIntColumn';

const SolidFloatColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    return SolidIntColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
};

export default SolidFloatColumn;