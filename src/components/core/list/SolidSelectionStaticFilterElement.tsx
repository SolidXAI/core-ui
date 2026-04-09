
import { useState } from "react";
import { SolidAutocomplete } from "../../shad-cn-ui";


export const SolidSelectionStaticFilterElement = ({ value, updateInputs, index, fieldMetadata }: any) => {

    // selection dynamic specific code. 
    const [selectionStaticItems, setSelectionStaticItems] = useState([]);
    const selectionStaticSearch = (event: { query: string }) => {
        const selectionStaticData = fieldMetadata.selectionStaticValues.map((i: string) => {
            return {
                label: i.split(":")[1],
                value: i.split(":")[0]
            }
        });
        const suggestionData = selectionStaticData.filter((t: any) => t.value.toLowerCase().startsWith(event.query.toLowerCase()));
        setSelectionStaticItems(suggestionData)
    }

    return (

        <SolidAutocomplete
            field="label"
            value={value}
            dropdown
            className="w-full solid-standard-autocomplete"
            inputClassName="solid-filter-compact-control"
            suggestions={selectionStaticItems}
            completeMethod={selectionStaticSearch}
            onChange={(e) => updateInputs(index, e.value)} />
    )
}
