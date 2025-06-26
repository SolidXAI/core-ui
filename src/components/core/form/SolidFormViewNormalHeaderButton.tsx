"use client";

import { Button } from 'primereact/button';
import { useHasAnyRole } from '@/helpers/rolesHelper';

interface SolidFormViewNormalHeaderButtonProps {
    button: any;
    params: any;
    formik: any;
    solidFormViewMetaData: any;
    handleCustomButtonClick: (attrs: any, event: any) => void;
}

export function SolidFormViewNormalHeaderButton({

    button,
    params,
    formik,
    solidFormViewMetaData,
    handleCustomButtonClick,
}: SolidFormViewNormalHeaderButtonProps) {
    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0
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
                    action: button.attrs.action,
                    params,
                    formik,
                    solidFormViewMetaData: solidFormViewMetaData.data,
                };
                handleCustomButtonClick(button.attrs, event);
            }}
        />
    );
}
