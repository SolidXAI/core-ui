"use client"
import Link from 'next/link'
import { Button } from 'primereact/button'
import React, { useState } from 'react'
import { CallIcon } from './CallIcon'
import { EmailIcon } from './EmailIcon'
import { HeaderCart } from './HeaderCart'
import { PrimaryCustomDropdown } from './CustomDropdown'
import { ProductNavData } from './productNavData'
import { useRouter } from 'next/navigation'
export const CustomHeader = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const toggleDropdown = () => setDropdownVisible(!dropdownVisible);
    const router = useRouter();
    return (
        <div className='px-6 flex align-items-center fixed w-full z-5 bg-white custom-header' style={{ height: 70 }}>
            <div className='flex align-items-center px-2'>
                <Link className="custom-header-logo" href={process.env.BASE_FRONTEND_APPLICATION as string}>
                    <img
                        alt='logo'
                        src={'/images/radix-logo.png'}
                        className='relative'
                    />
                </Link>
                <ul className='flex align-items-center header-ul'>
                    <li className={`header-li-btn ${dropdownVisible ? 'active-nav-item' : 'deactive-nav-item'}`} onClick={toggleDropdown}>
                        <Button plain label="PRODUCTS" className='text-sm text-900' text iconPos='right' icon="pi pi-angle-down" />
                    </li>
                    <li className='header-li-btn'>
                        <Button label="AUTOMATION" className='text-sm text-900' text iconPos='right' icon="pi pi-angle-down" link  onClick={() => window.open(process.env.BASE_FRONTEND_APPLICATION, '_self')}/>
                    </li>
                    <li className='header-li-btn'>
                        <Button link label="COMPANY" className='text-sm text-900' text onClick={() => window.open(process.env.BASE_FRONTEND_APPLICATION, '_self')} />
                    </li>
                    <li className='header-li-px'>
                        <Button label="SEARCH" className='h-3rem text-sm text-900 border-200 border-3 w-20rem text-left flex-1' severity="secondary" text rounded iconPos='right' icon="pi pi-search" />
                    </li>
                    <li className='header-li-px header-li-btn'>
                        <Button link label="LOGIN" className='text-sm text-900' text  onClick={() => window.open(process.env.BASE_FRONTEND_APPLICATION, '_self')}/>
                    </li>
                    <li>
                        <HeaderCart />
                    </li>
                    <li className='header-li-px'>
                        <Button label="+91 22 42537777" className='h-3rem text-sm text-900 border-200 border-3 py-0 pl-2 gap-2' severity="secondary" text rounded icon={<CallIcon />} link  onClick={() => window.open(process.env.BASE_FRONTEND_APPLICATION, '_self')}/>
                    </li>
                    <li className='header-li-px'>
                        <Button label="esales@radix.co.in" className='h-3rem text-sm text-900 border-200 border-3 py-0 pl-2 gap-2' severity="secondary" text rounded icon={<EmailIcon />} link  onClick={() => window.open(process.env.BASE_FRONTEND_APPLICATION, '_self')}/>
                    </li>
                </ul>
            </div>
            {dropdownVisible && (
                <div
                    className='custom-dropdown absolute left-0 bg-white main-megamenu-animation main-megamenu-slide-down-in'
                // ref={dropdownRef}
                // onMouseLeave={hideDropdown}
                >
                    <PrimaryCustomDropdown data={ProductNavData} />
                    {/* Dropdown content goes here */}
                </div>
            )}
        </div>
    )
}