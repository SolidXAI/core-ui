import { useState } from "react";
import { SolidAutocomplete } from "../../shad-cn-ui/SolidAutocomplete";


export const SolidSelectionStaticFilterElement = ({ value, updateInputs, index, fieldMetadata, multiple = false }: any) => {

    // selection dynamic specific code. 
    const [selectionStaticItems, setSelectionStaticItems] = useState([]);
    const selectionStaticSearch = (event: any) => {
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
            multiple={multiple}
            dropdown
            suggestions={selectionStaticItems}
            completeMethod={selectionStaticSearch}
            onChange={(e) => updateInputs(index, e.value)}
            className="w-full"
            inputClassName="w-full p-inputtext-sm solid-filter-compact-control"
        />
    )
}
