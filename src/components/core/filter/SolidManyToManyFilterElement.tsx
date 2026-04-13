

import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { useEffect, useState } from "react";
import qs from "qs";
import { SolidAutocomplete } from "../../shad-cn-ui/SolidAutocomplete";

export const SolidManyToManyFilterElement = ({
    value = [],
    updateInputs,
    index,
    fieldMetadata,
    multiple = false
}: any) => {

    const entityApi = createSolidEntityApi(fieldMetadata.relationCoModelSingularName);
    const { useLazyGetSolidEntitiesQuery } = entityApi;
    const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

    const [suggestions, setSuggestions] = useState<any[]>([]);

    const search = async (event: any) => {
        const queryData = {
            offset: 0,
            limit: 20,
            filters: {
                [fieldMetadata?.relationModel?.userKeyField?.name]: {
                    $containsi: event.query
                }
            }
        };

        const qsString = qs.stringify(queryData, { encodeValuesOnly: true });
        const response = await triggerGetSolidEntities(qsString);

        if (response.data) {
            setSuggestions(
                response.data.records.map((item: any) => ({
                    label: item[fieldMetadata.relationModel.userKeyField.name],
                    value: item.id
                }))
            );
        }
    };


    return (
        <SolidAutocomplete
            dropdown
            field="label"
            value={value}
            multiple={multiple}
            suggestions={suggestions}
            completeMethod={search}
            onChange={(e) => {
                // const cleanValues = Array.isArray(e.value) ? e.value : [];
                // updateInputs(index, cleanValues);
                updateInputs(index, e.value)
            }}
            placeholder={`Select ${fieldMetadata.displayName}`}
            className="w-full"
            inputClassName="w-full p-inputtext-sm solid-filter-compact-control"
        />
    );
};
