'use client'
import Link from 'next/link';
import { useState } from 'react';
export interface TertiaryProps {
    id: number,
    title: string,
    slug: string,
}
export interface SecondaryProps {
    id: number,
    title: string,
    subProducts: TertiaryProps[]
}
export interface PrimaryDataProps {
    id: number,
    title: string,
    icon: string,
    subProducts: SecondaryProps[]
}
export interface RootProps {
    data: PrimaryDataProps[],
}
export const PrimaryCustomDropdown = (props: RootProps) => {
    const { data } = props;
    const [subMenu, setSubMenu] = useState<SecondaryProps[]>([]);
    const [subSubMenu, setSubSubMenu] = useState<TertiaryProps[]>([]);
    const [openPrimaryId, setOpenPrimaryId] = useState<number | null>(null);
    const [openSecondaryId, setOpenSecondaryId] = useState<number | null>(null);
    const handleSubmenu = (id: number, subProducts: SecondaryProps[]) => {
        setSubMenu(subProducts);
        setSubSubMenu([]);
        setOpenPrimaryId(id);
        setOpenSecondaryId(null);
    }
    const handleSubSubmenu = (id: number, subProducts: TertiaryProps[]) => {
        setSubSubMenu(subProducts);
        setOpenSecondaryId(id);
    }
    return (
        <div className=' w-full flex flex-column p-3' style={{ height: 'calc(100vh - 120px)' }}>
            <p className='text-lg font-bold primary-dark'>
                PRODUCTS
            </p>
            <div className='h-full w-full flex flex-row'>
                {/* Main menu */}
                {data.length > 0 &&
                    <div className='primary-custom-megamenu'>
                        <div className='px-3 w-full' style={{ direction: 'ltr' }}>
                            {data.map((item, i) => {
                                const isOpen = openPrimaryId === item.id;
                                return (
                                    <>
                                        {item.subProducts.length > 0 ?
                                            <div
                                                key={item.id}
                                                className={`btn ${isOpen ? 'open-dropdown-item' : 'active-dropdown-item'}`}
                                                onClick={() => handleSubmenu(item.id, item.subProducts)}
                                            >
                                                <div className='flex align-items-center text-left text-nowrap gap-3'>
                                                    <div>
                                                        <img
                                                            src={item.icon}
                                                            alt={item.title + i}
                                                        />
                                                    </div>
                                                    {item.title}
                                                </div>
                                                <div>
                                                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L1 9" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" />
                                                    </svg>
                                                </div>
                                            </div> : <Link
                                                href={process.env.BASE_FRONTEND_APPLICATION as string}
                                                key={item.id}
                                                className={`btn no-underline ${isOpen ? 'open-dropdown-item' : 'active-dropdown-item'}`}
                                            // onClick={() => handleSubmenu(item.id, item.subProducts)}
                                            >
                                                <div className='flex align-items-center text-left text-nowrap gap-3'>
                                                    <div>
                                                        <img
                                                            src={item.icon}
                                                            alt={item.title + i}
                                                        />
                                                    </div>
                                                    {item.title}
                                                </div>
                                                <div>
                                                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L1 9" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" />
                                                    </svg>
                                                </div>
                                            </Link>}
                                    </>

                                )
                            })}
                        </div>
                    </div>
                }
                {subMenu.length > 0 &&
                    <div className='primary-custom-megamenu'>
                        <div className='px-3 w-full' style={{ direction: 'ltr' }}>
                            {subMenu.map((item) => {
                                const isOpen = openSecondaryId === item.id;
                                return (
                                    <>
                                        {item.subProducts.length > 0 ?

                                            <div
                                                key={item.id}
                                                className={`flex btn gap-3 justify-content-between ${isOpen ? 'open-dropdown-item' : 'active-dropdown-item'}`}
                                                onClick={() => handleSubSubmenu(item.id, item.subProducts)}
                                            >
                                                <div className='flex align-items-center text-left text-nowrap gap-3'>
                                                    {item.title}
                                                </div>
                                                <div>
                                                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L1 9" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                            :
                                            <Link
                                                href={process.env.BASE_FRONTEND_APPLICATION as string}
                                                key={item.id}
                                                className={`flex btn gap-3 justify-content-between ${isOpen ? 'open-dropdown-item' : 'active-dropdown-item'}`}
                                            // onClick={() => handleSubSubmenu(item.id, item.subProducts)}
                                            >
                                                <div className='flex align-items-center text-left text-nowrap gap-3'>
                                                    {item.title}
                                                </div>
                                                <div>
                                                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L1 9" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" />
                                                    </svg>
                                                </div>
                                            </Link>
                                        }
                                    </>

                                )
                            })}
                        </div>
                    </div>
                }
                {subSubMenu.length > 0 &&
                    <div className='primary-custom-megamenu'>
                        <div className='px-3 w-full' style={{ direction: 'ltr' }}>
                            {subSubMenu.map((item) => {
                                return (
                                    <Link
                                        href={process.env.BASE_FRONTEND_APPLICATION as string}
                                        key={item.id}
                                        className='btn active-dropdown-item no-underline flex'
                                    >
                                        <div className='flex align-items-center text-left gap-3'>
                                            {item.title}
                                        </div>
                                        <div>
                                            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L1 9" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}