"use client";
import SolidBigintField from "./columns/SolidBigintField";
import SolidFloatField from "./columns/SolidFloatField";
import SolidDecimalField from "./columns/SolidDecimalField";
import SolidShortTextField from "./columns/SolidShortTextField";
import SolidLongTextField from "./columns/SolidLongTextField";
import SolidRichTextField from "./columns/SolidRichTextField";
import SolidBooleanField from "./columns/SolidBooleanField";
import SolidDateField from "./columns/SolidDateField";
import SolidDatetimeField from "./columns/SolidDatetimeField";
import SolidTimeField from "./columns/SolidTimeField";
import SolidRelationField from "./columns/SolidRelationField";
import SolidMediaSingleField from "./columns/SolidMediaSingleField";
import SolidMediaMultipleField from "./columns/SolidMediaMultipleField";
import SolidSelectionStaticField from "./columns/SolidSelectionStaticField";
import SolidSelectionDynamicField from "./columns/SolidSelectionDynamicField";
import SolidComputedField from "./columns/SolidComputedField";
import SolidExternalIdField from "./columns/SolidExternalIdField";
import SolidUuidField from "./columns/SolidUuidField";
import SolidIntField from "./columns/SolidIntField";
// import SolidRelationField from "./columns/SolidRelationField";
// import SolidMediaSingleField from "./columns/SolidMediaSingleField";
// import SolidMediaMultipleField from "./columns/SolidMediaMultipleField";
// import SolidSelectionStaticField from "./columns/SolidSelectionStaticField";
// import SolidSelectionDynamicField from "./columns/SolidSelectionDynamicField";
// import SolidComputedField from "./columns/SolidComputedField";
// import SolidExternalIdField from "./columns/SolidExternalIdField";
// import SolidUuidField from "./columns/SolidUuidField";

export type SolidFilterFieldsParams = {
    solidViewMetaData?: any;
    fieldMetadata: any,
    onChange: any,
    index: any,
    rule: any
};

export const getNumberOfInputs = (matchMode: any): number | null => {
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

export const SolidFilterFields = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {

    if (fieldMetadata) {

        // And finally we can implement additional switching logic based on certain special fields. 
        if (fieldMetadata.name === 'id') {
            return SolidIntField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'int') {
            return SolidIntField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'bigint') {
            return SolidBigintField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'float') {
            return SolidFloatField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'decimal') {
            return SolidDecimalField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'shortText') {
            return SolidShortTextField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'longText') {
            return SolidLongTextField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'richText') {
            return SolidRichTextField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'boolean') {
            return SolidBooleanField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'date') {
            return SolidDateField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'datetime') {
            return SolidDatetimeField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'time') {
            return SolidTimeField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'relation') {
            return SolidRelationField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'mediaSingle') {
            return SolidMediaSingleField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'mediaMultiple') {
            return SolidMediaMultipleField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'selectionStatic') {
            return SolidSelectionStaticField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'selectionDynamic') {
            return SolidSelectionDynamicField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'computed') {
            return SolidComputedField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'externalId') {
            return SolidExternalIdField({ fieldMetadata, onChange, index, rule });
        }
        if (fieldMetadata.type === 'uuid') {
            return SolidUuidField({ fieldMetadata, onChange, index, rule });
        }
    }
};
