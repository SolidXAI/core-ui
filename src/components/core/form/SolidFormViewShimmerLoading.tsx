"use client"
import React from 'react'
import styles from './solidFormViewShimmerLoading.module.css'
import { Skeleton } from 'primereact/skeleton'
export const SolidFormViewShimmerLoading = () => {
    return (
        <div className='h-screen surface-0'>
            <div className="page-header">
                <div className='flex align-items-center gap-3'>
                    <Skeleton width="2rem" height="2rem"></Skeleton>
                    <Skeleton width="300px" className='border-round-lg'></Skeleton>
                </div>
                <div className='flex align-items-center gap-3'>
                    <Skeleton width="4rem" height="2rem"></Skeleton>
                    <Skeleton width="4rem" height="2rem"></Skeleton>
                    <Skeleton width="2rem" height="2rem"></Skeleton>
                </div>
            </div>
            <div className="page-header" style={{ borderTop: '1px solid var(--primary-light-color)' }}>
                <div className='w-full flex align-items-center justify-content-end'>
                    <Skeleton width="30%" height="2rem"></Skeleton>
                </div>
            </div>
            <div className={styles.solidFormViewShimmerLoadingWrapper}>
                <div className='p-4'>
                    <div className='formgrid grid'>
                        <div className='field col-6'>
                            <div className='flex align-items-center gap-2'>
                                <Skeleton width="2rem" className='border-round-lg'></Skeleton>
                                <Skeleton width="2rem" className='border-round-lg'></Skeleton>
                                <Skeleton width="2rem" className='border-round-lg'></Skeleton>
                            </div>
                        </div>
                    </div>
                    <div className='formgrid grid mt-4'>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                        </div>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--primary-light-color)' }}></div>
                <div className='p-4'>
                    <div className='formgrid grid'>
                        <div className='field col-6'>
                            <div className='flex align-items-center gap-2'>
                                <Skeleton width="8rem" height='1.5rem' className='border-round-lg'></Skeleton>
                            </div>
                        </div>
                    </div>
                    <div className='formgrid grid mt-4'>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                        </div>
                        <div className='field col-6 flex flex-column gap-4'>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                            <div className='flex flex-column gap-2'>
                                <Skeleton width="40%" className='border-round-lg'></Skeleton>
                                <Skeleton width="100%" height="2rem"></Skeleton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}