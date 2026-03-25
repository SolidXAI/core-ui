import { useRef } from "react";
import { Toast } from "primereact/toast";
import { useRouter } from "../../hooks/useRouter";
import { env } from "../../adapters/env";
import { SolidButton } from "../shad-cn-ui";

export const SocialMediaLogin = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const googleApiConnectRedirectUrl = `${env("NEXT_PUBLIC_BACKEND_API_URL")}/api/iam/google/connect`;

    const showNotEnabledToast = (provider: "Apple" | "Meta") => {
        toast.current?.show({
            severity: "info",
            life: 2200,
            className: "solid-shadcn-toast",
            content: () => (
                <div className="solid-shadcn-toast-content">
                    <div className="solid-shadcn-toast-title">{provider} login</div>
                    <div className="solid-shadcn-toast-description">This provider is not enabled yet.</div>
                </div>
            ),
        });
    };

    return (
        <div className="mt-4">
            <Toast ref={toast} />
            <div className="solid-auth-social-grid">
                <SolidButton
                    type="button"
                    variant="outline"
                    className="solid-auth-social-btn"
                    onClick={() => showNotEnabledToast("Apple")}
                    aria-label="Login with Apple (not enabled)"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                </SolidButton>

                <SolidButton
                    type="button"
                    variant="outline"
                    className="solid-auth-social-btn"
                    onClick={() => router.push(googleApiConnectRedirectUrl)}
                    aria-label="Login with Google"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                        <path d="M21.8 12.23c0-.74-.07-1.45-.2-2.13H12v4.03h5.5a4.7 4.7 0 0 1-2.04 3.08v2.55h3.3c1.93-1.78 3.04-4.4 3.04-7.53z" fill="#4285F4" />
                        <path d="M12 22c2.75 0 5.05-.91 6.73-2.47l-3.3-2.55c-.92.62-2.1.99-3.43.99-2.64 0-4.88-1.78-5.68-4.18H2.9v2.63A10 10 0 0 0 12 22z" fill="#34A853" />
                        <path d="M6.32 13.79a6 6 0 0 1 0-3.58V7.58H2.9a10 10 0 0 0 0 8.84l3.42-2.63z" fill="#FBBC05" />
                        <path d="M12 6.02c1.49 0 2.82.51 3.87 1.5l2.9-2.9C17.04 2.98 14.74 2 12 2A10 10 0 0 0 2.9 7.58l3.42 2.63c.8-2.4 3.04-4.19 5.68-4.19z" fill="#EA4335" />
                    </svg>
                </SolidButton>

                <SolidButton
                    type="button"
                    variant="outline"
                    className="solid-auth-social-btn"
                    onClick={() => showNotEnabledToast("Meta")}
                    aria-label="Login with Meta (not enabled)"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                        <path d="M5.4 15.6c0-3.14 1.62-7.09 3.76-7.09 1.43 0 2.56 1.72 2.84 2.25.28-.53 1.41-2.25 2.84-2.25 2.14 0 3.76 3.95 3.76 7.09 0 1.79-.63 2.89-1.82 2.89-2.12 0-3.75-3.02-4.78-4.82-1.03 1.8-2.66 4.82-4.78 4.82-1.19 0-1.82-1.1-1.82-2.89z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </SolidButton>
            </div>
        </div>
    );
};
