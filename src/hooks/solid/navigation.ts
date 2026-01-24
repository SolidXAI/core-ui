// hooks/solid/navigation.ts
import {
    useNavigate,
    useLocation,
    useParams,
} from "react-router-dom";
import { useCallback, useMemo } from "react";

/* ---------------------------
   useRouter (Next-compatible)
---------------------------- */
export function useRouter() {
    const navigate = useNavigate();

    return {
        push: (href: string) => navigate(href),
        replace: (href: string) => navigate(href, { replace: true }),
        back: () => navigate(-1),
        forward: () => navigate(1),

        // No real equivalent in React Router, kept for API parity
        refresh: () => {
            navigate(0);
        },
    };
}

/* ---------------------------
   usePathname (Next-compatible)
---------------------------- */
export function usePathname(): string {
    const location = useLocation();
    return location.pathname;
}

/* ---------------------------
   useSearchParams (Next-compatible)
---------------------------- */
export function useSearchParams(): URLSearchParams {
    const location = useLocation();

    return useMemo(() => {
        return new URLSearchParams(location.search);
    }, [location.search]);
}
