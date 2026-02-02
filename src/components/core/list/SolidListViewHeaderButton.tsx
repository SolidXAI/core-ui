
import { useHasAnyRole } from "../../../helpers/rolesHelper";
import { Button } from "primereact/button";

export const SolidListViewHeaderButton = ({ button, params, solidListViewMetaData, handleCustomButtonClick, selectedRecords,filters }: any) => {
    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0
        ? true
        : useHasAnyRole(button?.attrs?.roles);

    if (!hasRole) return null;

    return (
        <Button
            type="button"
            className={`text-left ${button?.attrs?.className ?? "gap-2"}`}
            label={button.attrs.label}
            size="small"
            iconPos="left"
            icon={button?.attrs?.icon ?? button?.attrs?.icon}
            onClick={() => {
                const event = {
                    params,
                    solidListViewMetaData: solidListViewMetaData.data,
                    selectedRecords: selectedRecords,
                    filters
                };
                handleCustomButtonClick(button.attrs, event);
            }}
        />
    );
};