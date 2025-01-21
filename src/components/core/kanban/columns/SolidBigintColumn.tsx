import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import SolidIntColumn from './SolidIntColumn';

const SolidBigintColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    return SolidIntColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
};

export default SolidBigintColumn;