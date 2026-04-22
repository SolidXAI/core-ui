
import styles from './solidFormViewShimmerLoading.module.css'

const SkeletonBlock = ({ width, height, className }: { width?: string; height?: string; className?: string }) => (
    <div className={`solid-skeleton ${className ?? ""}`} style={{ width, height }} />
);

export const SolidFormViewShimmerLoading = () => {
    return (
        <div className='h-screen surface-0'>
            <div className="page-header pl-2 ">
                <div className='flex align-items-center gap-3'>
                    <SkeletonBlock width="50px" height='1.4rem' className='md:h-1.3rem  border-round-lg ' />
                    <SkeletonBlock width="300px" className='border-round-lg hidden md:flex' />
                </div>
                <div className='flex align-items-center gap-3'>
                    <SkeletonBlock width="2.7rem" height="1.6rem" className="md:w-4rem md:h-2rem" />
                    <SkeletonBlock width="2.7rem" height="1.6rem" className="md:w-4rem md:h-2rem" />
                    <SkeletonBlock width="2.7rem" height="1.6rem" className="md:w-4rem md:h-2rem flex md:hidden" />
                </div>
            </div>
            <div className="page-header" style={{ borderTop: '1px solid var(--primary-light-color)' }}>
                <div className='w-full flex align-items-center justify-content-end'>
                    <SkeletonBlock width="30%" height="2rem" />
                </div>
            </div>
            <div className={styles.solidFormViewShimmerLoadingWrapper}>
                <div className='p-4'>
                    <div className='formgrid grid'>
                        <div className='field col-6'>
                            <div className='flex align-items-center gap-2'>
                                <SkeletonBlock width="2rem" className='border-round-lg' />
                                <SkeletonBlock width="2rem" className='border-round-lg' />
                                <SkeletonBlock width="2rem" className='border-round-lg' />
                            </div>
                        </div>
                    </div>
                    <div className='formgrid grid mt-4'>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--primary-light-color)' }}></div>
                <div className='p-4'>
                    <div className='formgrid grid'>
                        <div className='field col-6'>
                            <div className='flex align-items-center gap-2'>
                                <SkeletonBlock width="8rem" height='1.5rem' className='border-round-lg' />
                            </div>
                        </div>
                    </div>
                    <div className='formgrid grid mt-4'>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-column gap-2'>
                                <SkeletonBlock width="40%" className='border-round-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
