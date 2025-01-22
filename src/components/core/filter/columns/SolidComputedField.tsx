'use client';
import SolidShortTextField from './SolidShortTextField';
import SolidIntField from './SolidIntField';
import SolidDateField from './SolidDateField';
import SolidDatetimeField from './SolidDatetimeField';
import { SolidFilterFieldsParams } from '../SolidFilterFields';

const SolidComputedField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    if (['text', 'string'].includes(fieldMetadata.computedFieldValueType)) {
        return SolidShortTextField({ fieldMetadata, onChange, index, rule });
    }
    if (['int', 'decimal'].includes(fieldMetadata.computedFieldValueType)) {
        return SolidIntField({ fieldMetadata, onChange, index, rule });
    }
    if (fieldMetadata.computedFieldValueType === 'date') {
        return SolidDateField({ fieldMetadata, onChange, index, rule });
    }
    if (fieldMetadata.computedFieldValueType === 'datetime') {
        return SolidDatetimeField({ fieldMetadata, onChange, index, rule });
    }
};

export default SolidComputedField;