"use client";
import { SolidFilterFieldsParams } from '../SolidFilterFields';
import SolidRelationManyToOneField from './relations/SolidRelationManyToOneField';

const SolidRelationField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    if (fieldMetadata.relationType === 'many-to-one') {
        return SolidRelationManyToOneField({ fieldMetadata, onChange, index, rule });
    }
    // TODO: Support one-to-many
    // TODO: Support many-to-many
};

export default SolidRelationField;