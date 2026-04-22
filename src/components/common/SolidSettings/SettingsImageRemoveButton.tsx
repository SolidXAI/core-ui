import { SolidButton } from '../../shad-cn-ui'
import React from 'react'

export const SettingsImageRemoveButton = ({ onClick }: any) => {
    return (
        <SolidButton
            label="Remove"
            severity="danger"
            icon="pi pi-times"
            size="small"
            className="mt-2"
            onClick={onClick}
        />
    )
}
