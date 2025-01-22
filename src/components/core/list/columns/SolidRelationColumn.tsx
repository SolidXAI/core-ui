'use client';
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import SolidRelationManyToOneColumn from './relations/SolidRelationManyToOneColumn';

const SolidRelationColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    if (fieldMetadata.relationType === 'many-to-one') {
        return SolidRelationManyToOneColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    // TODO: Support one-to-many
    // TODO: Support many-to-many
};

export default SolidRelationColumn;