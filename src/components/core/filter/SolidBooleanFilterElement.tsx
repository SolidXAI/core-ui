import { useState } from "react";
import { SolidAutocomplete } from "../../shad-cn-ui/SolidAutocomplete";


export const SolidBooleanFilterElement = ({ value, updateInputs, index, fieldMetadata, multiple = false }: any) => {

    // selection dynamic specific code. 
    const [selectionStaticItems, setSelectionStaticItems] = useState<any>([]);
    const selectionStaticSearch = (event: any) => {
        const selectionStaticData = [
            { label: 'true', value: "true" },
            { label: 'false', value: "false" }
        ]
        const suggestionData = selectionStaticData.filter((t: any) => t.value.startsWith(event.query.toLowerCase()));
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
