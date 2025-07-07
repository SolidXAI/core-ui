"use client";
import { useLazyGetDashboardVariableSelectionDynamicValuesQuery } from "@/redux/api/dashboardApi";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import qs from "qs";
import { useState } from "react";


export const SolidDashboardSelectionDynamicFilterElement = ({ value, updateInputs, index, variableId }: any) => {


    // selection dynamic specific code. 
    const [triggerGetSelectionDynamicValues] = useLazyGetDashboardVariableSelectionDynamicValuesQuery();
    const [selectionDynamicItems, setSelectionDynamicItems] = useState([]);
    const selectionDynamicSearch = async (event: AutoCompleteCompleteEvent) => {

        // Get the list view layout & metadata first. 
        const queryData = {
            offset: 0,
            limit: 10,
            query: event.query,
            // variableId: variableId
            variableId: 3
        };

        const sdQs = qs.stringify(queryData, {
            encodeValuesOnly: true,
        });

        // TODO: do error handling here, possible errors like modelname is incorrect etc...
        const sdResponse = await triggerGetSelectionDynamicValues(sdQs);

        // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
        const sdData = sdResponse.data;

        // @ts-ignore
        setSelectionDynamicItems(sdData);
    }


    return (
        <AutoComplete
            field="label"
            value={value}
            dropdown
            suggestions={selectionDynamicItems}
            completeMethod={selectionDynamicSearch}
            onChange={(e) => updateInputs(index, e.value)}
            className="w-full"
            inputClassName="w-full p-inputtext-sm"
        />
    )
}