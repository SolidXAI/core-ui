import { useState } from "react";
import { SolidFormFieldWidgetProps } from "../../../../../types/solid-core";
import { solidGet } from "../../../../../http/solidHttp";
import { SolidAutocomplete } from "../../../../../components/shad-cn-ui/SolidAutocomplete";
import { SolidInput } from "../../../../../components/shad-cn-ui/SolidInput";
import { SolidIcon } from "../../../../../components/shad-cn-ui/SolidIcon";

export const SolidLovTypeChangeFormEditWidget = ({
    formik,
    fieldContext
}: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;

    const fieldLabel =
        fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldName = fieldLayoutInfo?.attrs?.name;

    const value = formik.values?.[fieldName];

    // 🔹 UI State
    const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");

    // 🔹 Handle Autocommplete AJAX Fetching
    const completeMethod = async (event: { query: string }) => {
        try {
            const query = event.query;
            // Build the URL following the user's provided filter pattern

            const filterPart = query
                ? `&filters[$and][0][$or][0][${fieldName}][$containsi]=%${query}%`
                : "";

            const res = await solidGet(
                `/api/list-of-values?&offset=0&limit=50&groupBy[0]=${fieldName}&aggregates[0]=id:count${filterPart}`
            );

            const extracted =
                res?.data?.data?.groupMeta
                    ?.filter((item: any) => item.groupValue != null)
                    .map((item: any) => ({
                        label: item.groupValue,
                        value: item.groupValue
                    })) || [];

            setFilteredOptions(extracted);
        } catch (err) {
            console.error("Failed to fetch autocomplete suggestions", err);
            setFilteredOptions([]);
        }
    };

    // 🔹 Handle Change from Autocomplete
    const handleAutocompleteChange = (e: { value: any }) => {
        const selectedValue = typeof e.value === "object" ? e.value?.value : e.value;
        formik.setFieldValue(fieldName, selectedValue);
    };

    // 🔹 Handle Input Submit (blur or enter)
    const handleCreate = () => {
        if (!inputValue.trim()) return;
        formik.setFieldValue(fieldName, inputValue);
        setIsCreating(false);
    };

    return (
        <div className="solid-lov-type-change-widget w-full">
            <div className="flex align-items-center justify-between  mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {fieldLabel}
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setIsCreating(!isCreating);
                        if (!isCreating) setInputValue("");
                    }}
                    style={{ color: "blue", background: "transparent", border: 0 }}
                >
                    <SolidIcon name={isCreating ? "si-times" : "si-plus"} size={12} />
                    <span>{isCreating ? "choose existing" : "add custom"}</span>
                </button>
            </div>

            <div className="relative">
                {!isCreating ? (
                    <SolidAutocomplete
                        value={value}
                        suggestions={filteredOptions}
                        completeMethod={completeMethod}
                        onChange={handleAutocompleteChange}
                        dropdown
                        placeholder={`Select ${fieldLabel}`}
                        className="w-full"
                    />
                ) : (
                    <div className="flex gap-2">
                        <SolidInput
                            type="text"
                            value={inputValue}
                            autoFocus
                            placeholder="Enter new type"
                            className="flex-1 h-9"
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleCreate}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreate();
                                }
                                if (e.key === "Escape") {
                                    setIsCreating(false);
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};