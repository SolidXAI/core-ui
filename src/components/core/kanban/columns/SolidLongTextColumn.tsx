"use client";
import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import SolidShortTextColumn from './SolidShortTextColumn';

const SolidLongTextColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    return SolidShortTextColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
};

export default SolidLongTextColumn;