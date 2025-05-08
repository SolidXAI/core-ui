import { createPermission } from '@/helpers/permissions'
import { SolidCreateButton } from '../common/SolidCreateButton'
import Image from 'next/image'

export const SolidEmptyListViewPlaceholder = ({ createButtonUrl, actionsAllowed, params, solidListViewMetaData }: any) => {
    const noDataText = solidListViewMetaData?.data?.solidView?.layout?.attrs?.listViewNoDataHelperText
        ?? (process.env.NEXT_PUBLIC_DEFAULT_LIST_VIEW_NODATA_HELPER_TEXT && solidListViewMetaData?.data?.solidView?.displayName
            ? `${process.env.NEXT_PUBLIC_DEFAULT_LIST_VIEW_NODATA_HELPER_TEXT} ${solidListViewMetaData.data.solidView.displayName}`
            : null)
    return (
        <div className="page-parent-wrapper">
            <div className="page-header">
                <p className="m-0 view-title">{solidListViewMetaData?.data?.solidView?.displayName}</p>
            </div>
            <div className='solid-empty-listview-placeholder-container'>
                {process.env.NEXT_PUBLIC_DEFAULT_LIST_VIEW_NODATA_IMAGE &&
                    <Image
                        alt={solidListViewMetaData?.data?.solidView?.displayName}
                        src={process.env.NEXT_PUBLIC_DEFAULT_LIST_VIEW_NODATA_IMAGE}
                        className='relative'
                        height={385}
                        width={617}
                    />
                }
                <div className='text-base font-bold'>
                    No Data Available.
                </div>
                {noDataText &&
                    <div className='text-sm mt-1'>
                        {noDataText}
                    </div>
                }
                {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded !== true &&
                    <div className='mt-2'>
                        <SolidCreateButton url={createButtonUrl} title={solidListViewMetaData?.data?.solidView?.displayName} />
                    </div>
                }
            </div>
        </div>
    )
}