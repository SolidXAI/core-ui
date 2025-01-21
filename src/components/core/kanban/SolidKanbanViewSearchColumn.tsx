"use client";
import SolidIntColumn from "./columns/SolidIntColumn";
import SolidBigintColumn from "./columns/SolidBigintColumn";
import SolidFloatColumn from "./columns/SolidFloatColumn";
import SolidDecimalColumn from "./columns/SolidDecimalColumn";
import SolidShortTextColumn from "./columns/SolidShortTextColumn";
import SolidLongTextColumn from "./columns/SolidLongTextColumn";
import SolidRichTextColumn from "./columns/SolidRichTextColumn";
import SolidBooleanColumn from "./columns/SolidBooleanColumn";
import SolidDateColumn from "./columns/SolidDateColumn";
import SolidDatetimeColumn from "./columns/SolidDatetimeColumn";
import SolidTimeColumn from "./columns/SolidTimeColumn";
import SolidRelationColumn from "./columns/SolidRelationColumn";
import SolidMediaSingleColumn from "./columns/SolidMediaSingleColumn";
import SolidMediaMultipleColumn from "./columns/SolidMediaMultipleColumn";
import SolidSelectionStaticColumn from "./columns/SolidSelectionStaticColumn";
import SolidSelectionDynamicColumn from "./columns/SolidSelectionDynamicColumn";
import SolidComputedColumn from "./columns/SolidComputedColumn";
import SolidExternalIdColumn from "./columns/SolidExternalIdColumn";
import SolidUuidColumn from "./columns/SolidUuidColumn";
// import SolidRelationColumn from "./columns/SolidRelationColumn";
// import SolidMediaSingleColumn from "./columns/SolidMediaSingleColumn";
// import SolidMediaMultipleColumn from "./columns/SolidMediaMultipleColumn";
// import SolidSelectionStaticColumn from "./columns/SolidSelectionStaticColumn";
// import SolidSelectionDynamicColumn from "./columns/SolidSelectionDynamicColumn";
// import SolidComputedColumn from "./columns/SolidComputedColumn";
// import SolidExternalIdColumn from "./columns/SolidExternalIdColumn";
// import SolidUuidColumn from "./columns/SolidUuidColumn";

export type SolidKanbanViewColumnParams = {
    solidKanbanViewMetaData: any;
    fieldMetadata: any,
    updateEnumValues: any,
    index: any,
    enumValue: any
};

export const getSolidKanbanViewNumberOfInputs = (matchMode: any): number | null => {
    if (matchMode.label && matchMode.label === 'Not In') {
        matchMode = 'notIn';
    }

    switch (matchMode) {
        case 'between':
            return 2;
        case 'in':
        case 'notIn':
            return null;
        case 'startsWith':
        case 'contains':
        case 'notContains':
        case 'endsWith':
        case 'equals':
        case 'notEquals':
        case 'lt':
        case 'lte':
        case 'gt':
        case 'gte':
            return 1;
        default:
            return 1; // Default to single input if no specific match is found
    }
}

export const SolidKanbanViewSearchColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {

    if (fieldMetadata) {

        // And finally we can implement additional switching logic based on certain special fields. 
        if (fieldMetadata.name === 'id') {
            return SolidIntColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'int') {
            return SolidIntColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'bigint') {
            return SolidBigintColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'float') {
            return SolidFloatColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'decimal') {
            return SolidDecimalColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'shortText') {
            return SolidShortTextColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'longText') {
            return SolidLongTextColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'richText') {
            return SolidRichTextColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'boolean') {
            return SolidBooleanColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'date') {
            return SolidDateColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'datetime') {
            return SolidDatetimeColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'time') {
            return SolidTimeColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'relation') {
            return SolidRelationColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'mediaSingle') {
            return SolidMediaSingleColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'mediaMultiple') {
            return SolidMediaMultipleColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'selectionStatic') {
            return SolidSelectionStaticColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'selectionDynamic') {
            return SolidSelectionDynamicColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'computed') {
            return SolidComputedColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'externalId') {
            return SolidExternalIdColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
        if (fieldMetadata.type === 'uuid') {
            return SolidUuidColumn({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue });
        }
    }
};
