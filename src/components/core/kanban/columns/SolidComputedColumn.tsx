import SolidShortTextColumn from './SolidShortTextColumn';
import SolidIntColumn from './SolidIntColumn';
import SolidDateColumn from './SolidDateColumn';
import SolidDatetimeColumn from './SolidDatetimeColumn';
import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';

const SolidComputedColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    if (['text', 'string'].includes(fieldMetadata.computedFieldValueType)) {
        return SolidShortTextColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
    }
    if (['int', 'decimal'].includes(fieldMetadata.computedFieldValueType)) {
        return SolidIntColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
    }
    if (fieldMetadata.computedFieldValueType === 'date') {
        return SolidDateColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
    }
    if (fieldMetadata.computedFieldValueType === 'datetime') {
        return SolidDatetimeColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
    }
};

export default SolidComputedColumn;