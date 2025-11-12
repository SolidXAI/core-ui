"use client";

import { useHasAnyRole } from "@/helpers/rolesHelper";
import { Button } from "primereact/button";

export const SolidListViewRowButtonContextMenu = ({ button, params, getSelectedSolidViewData, solidListViewMetaData, handleCustomButtonClick }: any) => {
    const selectedSolidViewData = getSelectedSolidViewData?.();
    
    const hasRole =
        !button?.attrs?.roles || button?.attrs?.roles.length === 0
            ? true
            : useHasAnyRole(button?.attrs?.roles);

    if (!hasRole) return null;

    return (
        <Button
            type="button"
            icon={button?.attrs?.icon ? button?.attrs?.icon : "pi pi-pencil"}
            className={`w-full text-left gap-2 ${button?.attrs?.className ? button?.attrs?.className : ''}`}
            label={button.attrs.label}
            size="small"
            onClick={() => {
                const event = {
                    params,
                    rowData: selectedSolidViewData,
                    solidListViewMetaData: solidListViewMetaData.data,
                };
                handleCustomButtonClick(button.attrs, event);
            }}
        />
    );
};
