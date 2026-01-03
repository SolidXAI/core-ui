'use client';
import { AutoComplete } from "primereact/autocomplete";
import { useEffect, useState } from "react";



// UsesCases
// Suppose you have a moduelId field In create Dto then you need to creaate a module key in firmik and use that to store the autocomplete state and along with it update the moduleId  Field with id
// In case of relationType the Id field will always will be id   
// Else the value will be whatever valuekey use passed 

export const MultipleSelectAutoCompleteField = ({ formik, isFormFieldValid, relationField, fieldName, fieldNameId, labelKey, valueKey, searchData, existingData, additionalAction }: any) => {

    const [selectedItem, setSelectedItem] = useState(existingData && existingData.length > 0 && existingData.map((i: any) => ({ label: i, value: i })));
    const [filteredItem, setFilteredItem] = useState([]);
    useEffect(() => {
        // if (existingData) {
        setSelectedItem(existingData && existingData.length > 0 && existingData.map((i: any) => ({ label: i, value: i })))
        // formik.setFieldValue(fieldName, existingData);

        // }
    }, [existingData])
    const searchItems = async (event: any) => {
        const data = await searchData(event);
        setFilteredItem(data);

    };


    const MAX_VISIBLE_ITEMS = 5;
    const ITEM_HEIGHT = 38;
    
    const height =
      filteredItem.length >= MAX_VISIBLE_ITEMS
        ? MAX_VISIBLE_ITEMS * ITEM_HEIGHT + 10
        : MAX_VISIBLE_ITEMS * ITEM_HEIGHT;
    
    const MAX_HEIGHT = `${height}px`;

    return (

        <AutoComplete
            multiple
            value={selectedItem}
            suggestions={filteredItem}
            invalid={isFormFieldValid(formik, fieldName)}
            completeMethod={searchItems}
            // virtualScrollerOptions={{ itemSize: 38 }}
            virtualScrollerOptions={
                filteredItem.length > MAX_VISIBLE_ITEMS
                  ? {
                      itemSize: ITEM_HEIGHT,
                      scrollHeight: MAX_HEIGHT
                    }
                  : undefined
              }
            className="solid-standard-autocomplete w-full"
            // style={{
            //     maxHeight: 39.67
            // }}
            field={labelKey}
            dropdown
            onChange={(e) => {
                setSelectedItem(e.value);
                if (additionalAction) {
                    additionalAction(e);
                }
                if (relationField === true) {
                    formik.setFieldValue(fieldName, e.value);
                    // formik.setFieldValue(fieldNameId, e.value.id);
                } else {
                    const mediaTypes = e.value.map((i: any) => i[valueKey]);
                    formik.setFieldValue(fieldName, mediaTypes);
                }
            }}
        />
    )
}