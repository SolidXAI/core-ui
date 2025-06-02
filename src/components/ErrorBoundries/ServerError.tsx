"use client"
import Image from "next/image";
import { Button } from "primereact/button";
import SolidLogo from '../../resources/images/SS-Logo.png'

// components/ServerError.tsx
export const ServerError = ({ error }: any) => {
    return (
        <div className="flex flex-column align-items-center justify-content-center" style={{ height: '100vh' }}>
            {/* <div className={`solid-logo flex align-items-center`}>
                <Image
                    alt="solid logo"
                    src={process.env.NEXT_PUBLIC_AUTH_LOGO ?? SolidLogo}
                    className="relative"
                    fill
                />
            </div> */}
            <h1 className="font-bold">Server Error</h1>
            <p>{error?.code} - {error?.message}</p>
            <Button
                onClick={() => location.reload()}
            >
                Try Again
            </Button>
        </div>
    );
}