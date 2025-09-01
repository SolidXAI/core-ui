// components/OfflineNotice.tsx
"use client";

import { Button } from "primereact/button";
import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import SolidLogo from '../../resources/images/SS-Logo.png'
import Image from "next/image";

export default function OfflineNotice() {
    const [checking, setChecking] = useState(false);
    const toast = useRef<Toast>(null);
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };
    const handleCheckAgain = () => {
        setChecking(true);

        // Wait briefly before checking online status again
        setTimeout(() => {
            if (navigator.onLine) {
                window.location.reload(); // Refresh the page if back online
            } else {
                showToast("error", "Still offline", "Please check your internet connection.")
            }
            setChecking(false);
        }, 500);
    };

    return (
        <div style={{ height: '100vh', backgroundColor: '#FFF' }} className="flex flex-column align-items-center justify-content-center">
            <Toast />
            {/* <div className={`solid-logo flex align-items-center`}>
                <Image
                    alt="solid logo"
                    src={process.env.NEXT_PUBLIC_AUTH_LOGO ?? SolidLogo}
                    className="relative"
                    fill
                />
            </div> */}
            <h2 className="font-bold">You Are Offline</h2>
            <Button
                onClick={handleCheckAgain}
                disabled={checking}
            >
                {checking ? "Checking..." : "Check Again"}
            </Button>
        </div>
    );
}