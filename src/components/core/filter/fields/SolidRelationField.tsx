
import { SolidFilterFieldsParams } from '../SolidFilterFields';
import SolidRelationManyToManyField from './relations/SolidRelationManyToManyField';
import SolidRelationManyToOneField from './relations/SolidRelationManyToOneField';
import SolidRelationOneToManyField from './relations/SolidRelationOneToManyField';

const SolidRelationField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    if (fieldMetadata.relationType === 'many-to-one') {
        return SolidRelationManyToOneField({ fieldMetadata, onChange, index, rule });
    }
    if (fieldMetadata.relationType === 'many-to-many') {
        return SolidRelationManyToManyField({ fieldMetadata, onChange, index, rule });
    }
    if (fieldMetadata.relationType === 'one-to-many') {
        return SolidRelationOneToManyField({ fieldMetadata, onChange, index, rule });
    }
};

export default SolidRelationField;