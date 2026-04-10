import { useCallback, useEffect, useState } from "react";

type SolidAutocompleteFieldOptions = {
    formik: any;
    fieldName: string;
    fieldNameId?: string | null;
    labelKey: string;
    valueKey: string;
    searchData: (event: { query: string }) => Promise<any[]> | any[];
    existingData: any;
    relationField?: boolean;
    additionalAction?: (event: { value: any; target: { value: any } }) => void;
};

export const useSolidAutocompleteField = ({
    formik,
    fieldName,
    fieldNameId = null,
    labelKey,
    valueKey,
    searchData,
    existingData,
    relationField = false,
    additionalAction,
}: SolidAutocompleteFieldOptions) => {
    const [selectedItem, setSelectedItem] = useState(existingData);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);

    useEffect(() => {
        setSelectedItem(existingData);
    }, [existingData]);

    const searchItems = useCallback(async (event: { query: string }) => {
        try {
            const data = await searchData(event);
            setFilteredItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setFilteredItems([]);
        }
    }, [searchData]);

    const handleFormUpdates = useCallback((value: any) => {
        if (relationField) {
            formik.setFieldValue(fieldName, value || null);
            if (fieldNameId) {
                formik.setFieldValue(fieldNameId, value ? value.id : null);
            }
        } else {
            if (value && typeof value === "object") {
                formik.setFieldValue(fieldName, value[valueKey]);
            } else {
                formik.setFieldValue(fieldName, value ?? "");
            }
        }
    }, [fieldName, fieldNameId, formik, relationField, valueKey]);

    const handleChange = useCallback(({ value }: { value: any }) => {
        setSelectedItem(value);
        const syntheticEvent = {
            value,
            target: {
                value,
            },
        };
        additionalAction?.(syntheticEvent);
        handleFormUpdates(value);
    }, [additionalAction, handleFormUpdates]);

    return {
        selectedItem,
        filteredItems,
        searchItems,
        handleChange,
        labelKey,
    };
};
