'use client';

import { AutoComplete } from "primereact/autocomplete";
import { useEffect, useState } from "react";



export const AutoCompleteField = ({ multiple, isFormFieldValid, formik, fieldName, searchData, existingData, existingDataTitle, existingDataId, onBlur }: any) => {




    const [selectedItem, setSelectedItem] = useState(existingData);
    const [filteredItem, setFilteredItem] = useState([]);
    useEffect(() => {
        if (existingData) {
            setSelectedItem(existingData)
            // formik.setFieldValue(fieldName, existingData);

        }
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
            value={selectedItem}
            multiple={multiple ? multiple : false}
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
            field="label"
            dropdown
            onBlur={onBlur}
            onChange={(e) => {
                let data = {};

              
                if (typeof (e.value) == "string") {
                    data = e.value
                } else {
                    if (multiple === true) {
                        data = e.value.map((m: any) =>
                        ({
                            label: m.label,
                            name: m.label,
                            value: m.value,
                            id: m.value,
                        }))
                    } else {
                        data = {
                            label: e.value.label,
                            name: e.value.label,
                            value: e.value.value,
                            id: e.value.value,
                        }
                    }
                }


                setSelectedItem(data);
                formik.setFieldValue(fieldName, data);
            }}
        />
    )
}