"use client";

import { useHasAnyRole } from "@/helpers/rolesHelper";
import { Button } from "primereact/button";

export const SolidListViewRowButtonContextMenu = ({ button, params, selectedSolidViewData, solidListViewMetaData, handleCustomButtonClick }: any) => {
    const hasRole =
        !button?.attrs?.roles || button?.attrs?.roles.length === 0
            ? true
            : useHasAnyRole(button?.attrs?.roles);

    if (!hasRole) return null;

    return (
        <Button
            text
            type="button"
            className="w-full text-left gap-2"
            label={button.attrs.label}
            size="small"
            iconPos="left"
            severity="contrast"
            icon={button?.attrs?.className ? button?.attrs?.className : "pi pi-pencil"}
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
