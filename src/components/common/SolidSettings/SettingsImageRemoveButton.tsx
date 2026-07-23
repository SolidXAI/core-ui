import React from 'react'
import { X } from "lucide-react";
import { SolidButton } from '../../shad-cn-ui'

export const SettingsImageRemoveButton = ({ onClick }: any) => {
    return (
        <SolidButton
            label="Remove"
            severity="danger"
            leftIcon={<X size={14} aria-hidden />}
            size="small"
            className="mt-2"
            onClick={onClick}
        />
    )
}
