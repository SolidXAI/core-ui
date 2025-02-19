"use client"

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';
export const BackButton = () => {
    const router = useRouter();
    const pathname = usePathname();

    const handleGoBack = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 1) {
            router.back()
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
            className='max-w-2rem bg-primary-reverse text-color'
        />
    )
}