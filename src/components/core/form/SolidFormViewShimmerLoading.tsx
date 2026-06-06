
import styles from './solidFormViewShimmerLoading.module.css'

const SkeletonBlock = ({ width, height, className }: { width?: string; height?: string; className?: string }) => (
    <div className={`solid-skeleton ${className ?? ""}`} style={{ width, height }} />
);

export const SolidFormViewShimmerLoading = () => {
    return (
        <div className='h-screen bg-surface-0'>
            <div className="page-header pl-2 ">
                <div className='flex items-center gap-4'>
                    <SkeletonBlock width="50px" height='1.4rem' className='md:h-5 rounded-lg' />
                    <SkeletonBlock width="300px" className='rounded-lg hidden md:flex' />
                </div>
                <div className='flex items-center gap-4'>
                    <SkeletonBlock width="2.7rem" height="1.6rem" className="md:w-16 md:h-8" />
                    <SkeletonBlock width="2.7rem" height="1.6rem" className="md:w-16 md:h-8" />
                    <SkeletonBlock width="2.7rem" height="1.6rem" className="md:w-16 md:h-8 flex md:hidden" />
                </div>
            </div>
            <div className="page-header" style={{ borderTop: '1px solid var(--primary-light-color)' }}>
                <div className='w-full flex items-center justify-end'>
                    <SkeletonBlock width="30%" height="2rem" />
                </div>
            </div>
            <div className={styles.solidFormViewShimmerLoadingWrapper}>
                <div className='p-4'>
                    <div className='flex flex-wrap'>
                        <div className='field w-1/2'>
                            <div className='flex items-center gap-2'>
                                <SkeletonBlock width="2rem" className='rounded-lg' />
                                <SkeletonBlock width="2rem" className='rounded-lg' />
                                <SkeletonBlock width="2rem" className='rounded-lg' />
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-wrap mt-6'>
                        <div className='field w-1/2 flex flex-col gap-6'>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                        <div className='field w-1/2 flex flex-col gap-6'>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--primary-light-color)' }}></div>
                <div className='p-4'>
                    <div className='flex flex-wrap'>
                        <div className='field w-1/2'>
                            <div className='flex items-center gap-2'>
                                <SkeletonBlock width="8rem" height='1.5rem' className='rounded-lg' />
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-wrap mt-6'>
                        <div className='field w-1/2 flex flex-col gap-6'>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                        <div className='field w-1/2 flex flex-col gap-6'>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <SkeletonBlock width="40%" className='rounded-lg' />
                                <SkeletonBlock width="100%" height="2rem" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
