"use client";
import { SolidFilterFieldsParams } from '../SolidFilterFields';
import SolidRelationManyToOneField from './relations/SolidRelationManyToOneField';
import SolidRelationOneToManyField from './relations/SolidRelationOneToManyField';

const SolidRelationField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    if (fieldMetadata.relationType === 'many-to-one') {
        return SolidRelationManyToOneField({ fieldMetadata, onChange, index, rule });
    }
    // TODO: Support one-to-many
    if (fieldMetadata.relationType === 'one-to-many') {
        return SolidRelationOneToManyField({ fieldMetadata, onChange, index, rule });
    }

    // TODO: Support many-to-many
};

export default SolidRelationField;