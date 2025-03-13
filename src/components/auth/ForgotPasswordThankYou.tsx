"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext } from "react";
import { LayoutContext } from "../layout/context/layoutcontext";
import Image from "next/image";
import SolidLogo from '../../resources/images/SS-Logo.png'


export const ForgotPasswordThankYou = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { authLayout } = layoutConfig;
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const decodedEmail = email ? decodeURIComponent(email) : '';
    return (
        <div>
            <div className={`auth-container ${authLayout === 'Center' ? 'center' : 'side'}`}>
                {authLayout === 'Center' &&
                    <div className="flex justify-content-center">
                        <div className="solid-logo flex align-items-center gap-3">
                            <Image
                                alt="solid logo"
                                src={SolidLogo}
                                className="relative"
                                fill
                            />
                            <div>
                                <p className="solid-logo-title">
                                    Solid<br />Starters
                                </p>
                            </div>
                        </div>
                    </div>
                }
                <h5 className='text-center font-bold'>We have sent an email to yourregistered email address</h5>
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