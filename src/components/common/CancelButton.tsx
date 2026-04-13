

import { usePathname } from "../../hooks/usePathname";
import { useRouter } from "../../hooks/useRouter";
import { X } from "lucide-react";
import { SolidButton } from "../shad-cn-ui";


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
            <SolidButton variant="outline" size="small" type="button" onClick={handleGoBack} className='bg-primary-reverse' style={{ minWidth: 66 }}>
                Close
            </SolidButton>
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
        const view = fromView === "kanban" || fromView === "card" ? fromView : "list";

        // Navigate back to the previous path with the appropriate view type
        const newPath = pathname.replace(/\/form\/[^/]+$/, `/${view}`);
        router.push(newPath);
        // fromView = sessionStorage.getItem("fromView");
        // if (fromView) {
        //     router.push(fromView);
        // } else {
        //     // fallback if path is not matched
        //     router.back();
        // }
    };
    return (
        <>
            {/* <div className="hidden lg:flex"> */}
            {/* <div> */}
            <SolidButton variant="outline" size="small" type="button" onClick={handleGoBack} className='bg-primary-reverse hidden lg:flex' style={{ minWidth: 66 }}>
                Close
            </SolidButton>
            {/* </div> */}
            {/* </div> */}
            <SolidButton size="small" type="button" leftIcon={<X size={14} />} onClick={handleGoBack} className='bg-primary-reverse solid-icon-button flex lg:hidden' />
        </>
    )
}
