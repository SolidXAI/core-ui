"use client"

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';
import { useEffect, useState } from 'react';
export const BackButton = () => {
    const router = useRouter();
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const [fromView, setFromView] = useState<"list" | "kanban" | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedView = sessionStorage.getItem("fromView");
            if (storedView === "list" || storedView === "kanban") {
                setFromView(storedView);
            }
        }
    }, []);

    const handleGoBack = () => {
        if (segments.length >= 4 && segments[0] === "admin" && segments[1] === "core") {
            const moduleName = segments[2];
            const modelName = segments[3];
            const targetView = fromView || "list";
            const targetUrl = `/admin/core/${moduleName}/${modelName}/${targetView}`;
            router.push(targetUrl);
        } else {
            // fallback if path is not matched
            router.back();
        }
    };
    // const router = useRouter();
    // const pathname = usePathname();

    // const handleGoBack = () => {
    //     // const segments = pathname.split('/').filter(Boolean);
    //     // if (segments.length > 1) {
    //         router.back()
    //     // }
    // };
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