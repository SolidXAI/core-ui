"use client"

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';
import { useEffect, useState } from 'react';
export const BackButton = () => {
    const router = useRouter();
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const handleGoBack = () => {
        let fromView: string | null = null;
        fromView = sessionStorage.getItem("fromView");
        if (fromView) {
            router.push(fromView);
        } else {
            // fallback if path is not matched
            router.back();
        }
    };
    return (
        <Button
            text
            icon='pi pi-arrow-left'
            size="small"
            type="button"
            aria-label="Back"
            onClick={handleGoBack}
            className='max-w-2rem bg-primary-reverse text-color solid-icon-button'
        />
    )
}