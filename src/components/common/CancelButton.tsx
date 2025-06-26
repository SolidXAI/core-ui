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
            <Button outlined size="small" type="button" label="Close" onClick={handleGoBack} className='bg-primary-reverse' style={{ minWidth: 66 }}/>
        </div>
    )
}

export const SolidCancelButton = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get the current path

    const handleGoBack = () => {
        let fromView: string | null = null;
        if (typeof window !== "undefined") {
            fromView = sessionStorage.getItem("fromView");
        }

        // Default to 'list' if not available
        const view = fromView === "kanban" ? "kanban" : "list";

        // Navigate back to the previous path with the appropriate view type
        const newPath = pathname.replace(/\/form\/[^/]+$/, `/${view}`);
        router.push(newPath);
    };
    return (
        <div>
            <Button outlined size="small" type="button" label="Close" onClick={handleGoBack} className='bg-primary-reverse' style={{ minWidth: 66 }}/>
        </div>
    )
}