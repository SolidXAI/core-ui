import React from 'react'

export const SolidListViewShimmerLoading = () => {
    const rows = Array.from({ length: 14 });
    const SkeletonBlock = ({ className = "" }: { className?: string }) => (
        <div className={`solid-list-skeleton-block ${className}`.trim()} />
    );

    return (
        <div className='h-screen surface-0'>
            {/* <div className="page-header pl-2 ">
                <div className='flex align-items-center gap-3'>
                    <Skeleton width="50px" height='1.4rem' className='md:h-1.3rem border-round-lg '></Skeleton>
                    <Skeleton width="300px" className='border-round-lg hidden md:flex'></Skeleton>
                </div>
                <div className='flex align-items-center gap-3'>
                    <Skeleton width="2.7rem" height="1.6rem" className="md:w-4rem md:h-2rem" />
                    <Skeleton width="2.7rem" height="1.6rem" className="md:w-4rem md:h-2rem" />
                    <Skeleton width="2.7rem" height="1.6rem" className="md:w-4rem md:h-2rem flex md:hidden" />
                </div>
            </div> */}
            <div className='solid-list-skeleton-wrapper'>
                <table className="solid-list-skeleton-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr className="solid-list-skeleton-header">
                            <th className="solid-list-skeleton-col-1">
                                <SkeletonBlock className="solid-list-skeleton-block-xs" />
                            </th>
                            <th className="solid-list-skeleton-col-2">
                                <SkeletonBlock className="solid-list-skeleton-block-sm" />
                            </th>
                            <th className="solid-list-skeleton-col-3">
                                <SkeletonBlock className="solid-list-skeleton-block-md" />
                            </th>
                            <th className="solid-list-skeleton-col-4">
                                <SkeletonBlock className="solid-list-skeleton-block-md" />
                            </th>
                            <th className="solid-list-skeleton-col-5">
                                <SkeletonBlock className="solid-list-skeleton-block-md" />
                            </th>
                            <th className="solid-list-skeleton-col-6">
                                <SkeletonBlock className="solid-list-skeleton-block-lg" />
                            </th>
                            <th className="solid-list-skeleton-col-7">
                                <SkeletonBlock className="solid-list-skeleton-block-xs" />
                            </th>
                            <th className="solid-list-skeleton-col-8">
                                <SkeletonBlock className="solid-list-skeleton-block-xs" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((_, i) => (
                            <tr className="solid-list-skeleton-row" key={i}>
                                <td><SkeletonBlock className="solid-list-skeleton-block-xs" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-fluid" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-fluid" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-fluid" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-fluid" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-fluid" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-circle" /></td>
                                <td><SkeletonBlock className="solid-list-skeleton-block-xxs" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='solid-list-skeleton-footer flex align-items-center justify-content-between'>
                    <div className='flex align-items-center gap-3'>
                        <SkeletonBlock className="solid-list-skeleton-block-lg" />
                        <SkeletonBlock className="solid-list-skeleton-block-xs" />
                    </div>
                    <div className='flex align-items-center gap-3'>
                        <SkeletonBlock className="solid-list-skeleton-block-sm" />
                        <SkeletonBlock className="solid-list-skeleton-block-xxs" />
                        <SkeletonBlock className="solid-list-skeleton-block-xs" />
                    </div>
                </div>
            </div>
        </div>
    )
}
