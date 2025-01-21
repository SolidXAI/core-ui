import { SolidListViewColumnParams } from '../SolidListViewColumn';
import SolidShortTextColumn from './SolidShortTextColumn';
import SolidIntColumn from './SolidIntColumn';
import SolidDateColumn from './SolidDateColumn';
import SolidDatetimeColumn from './SolidDatetimeColumn';

const SolidComputedColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    if (['text', 'string'].includes(fieldMetadata.computedFieldValueType)) {
        return SolidShortTextColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    if (['int', 'decimal'].includes(fieldMetadata.computedFieldValueType)) {
        return SolidIntColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    if (fieldMetadata.computedFieldValueType === 'date') {
        return SolidDateColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    if (fieldMetadata.computedFieldValueType === 'datetime') {
        return SolidDatetimeColumn({ solidListViewMetaData, fieldMetadata, column });
    }
};

export default SolidComputedColumn;