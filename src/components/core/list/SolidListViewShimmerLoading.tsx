import React from 'react'
import { SolidSpinner } from "../../shad-cn-ui";

export const SolidListViewShimmerLoading = () => {
    return (
        <div className='solid-list-loading-state'>
            <SolidSpinner size={30} label="Loading records" />
        </div>
    )
}
