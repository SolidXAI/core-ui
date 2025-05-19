"use client";
import { useHasAnyRole } from "@/helpers/rolesHelper";
import { Button } from "primereact/button";

export const SolidListViewHeaderButton = ({ button, params, solidListViewMetaData, handleCustomButtonClick }: any) => {
    const hasRole = !button.attrs.roles || button.attrs.roles.length === 0
        ? true
        : useHasAnyRole(button.attrs.roles);

    if (!hasRole) return null;

    return (
        <Button
            text
            type="button"
            className="w-full text-left gap-2"
            label={button.attrs.label}
            size="small"
            iconPos="left"
            icon={button?.attrs?.className ? button?.attrs?.className : "pi pi-pencil"}
            onClick={() => {
                const event = {
                    params,
                    solidListViewMetaData: solidListViewMetaData.data,
                };
                handleCustomButtonClick(button.attrs, event);
            }}
        />
    );
};