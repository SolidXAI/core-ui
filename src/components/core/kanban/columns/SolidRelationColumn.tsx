import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import SolidRelationManyToOneColumn from './relations/SolidRelationManyToOneColumn';

const SolidRelationColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    if (fieldMetadata.relationType === 'many-to-one') {
        return SolidRelationManyToOneColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
    }
    // TODO: Support one-to-many
    // TODO: Support many-to-many
};

export default SolidRelationColumn;