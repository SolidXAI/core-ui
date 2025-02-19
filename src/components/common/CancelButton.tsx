"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';


export const CancelButton = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get the current path

    const handleGoBack = () => {
        const segments = pathname.split('/').filter(Boolean); // Split and filter empty segments
        if (segments.length > 1) {
            // const newPath = '/' + segments.slice(0, -1).join('/') + '/all'; // Remove last segment and add "/all"
            // router.push(newPath); // Navigate to the parent route with "/all"            
            router.back()
        }
    };
    return (
        <div>
            <Button outlined size="small" type="button" label="Cancel" severity="danger" onClick={handleGoBack} className='bg-primary-reverse'/>
        </div>
    )
}

export const SolidCancelButton = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get the current path

    const handleGoBack = () => {
        const segments = pathname.split('/').filter(Boolean); // Split and filter empty segments
        if (segments.length > 1) {
            const newPath = '/' + segments.slice(0, -2).join('/') + '/list'; // Remove last segment and add "/all"
            router.push(newPath); // Navigate to the parent route with "/all"
        }
    };
    return (
        <div>
            <Button outlined size="small" type="button" label="Cancel" severity="danger" onClick={handleGoBack} />
        </div>
    )
}