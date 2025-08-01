"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";


export const ForgotPasswordThankYou = () => {
    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery()
    useEffect(() => {
        trigger("") // Fetch settings on mount
    }, [trigger])
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const decodedEmail = email ? decodeURIComponent(email) : '';
    return (
        <div>
            <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
                <h5 className='text-center font-bold'>We have sent an email to your registered email address</h5>
                <p className='font-bold text-center'>{decodedEmail}</p>
                <p className='text-center'>
                    Please follow the instructions in the email
                </p>
                <div className='text-center'>
                    <Link href={"/"} className='btn'>Back to Home</Link>
                </div>
            </div>
        </div>
    )
}