import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import SolidShortTextColumn from './SolidShortTextColumn';

const SolidRichTextColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    return SolidShortTextColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
};

export default SolidRichTextColumn;