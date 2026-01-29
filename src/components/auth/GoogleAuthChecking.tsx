import { ERROR_MESSAGES } from '../../constants/error-messages';
import { signIn } from "../../adapters/auth/index";
import { useRouter } from "../../hooks/useRouter";
import { useSearchParams } from "../../hooks/useSearchParams";
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react'
import { env } from "../../adapters/env";
import showToast from "../../helpers/showToast";

export const GoogleAuthChecking = () => {
    const searchParams = useSearchParams();
    const accessCode = searchParams.get("accessCode");

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const toast = useRef<Toast>(null);
    useEffect(() => {
        const handleOAuthAuthentication = async () => {
            try {
                const response = await signIn("credentials", {
                    redirect: false,
                    accessCode: accessCode
                    // accessToken: accessToken?.accessToken,
                    // refreshToken: accessToken?.refreshToken
                });

                if (response?.error) {
                    showToast(toast, "error", ERROR_MESSAGES.LOGIN_ERROR, response.error);
                    setError(ERROR_MESSAGES.AUTHENICATION__FAILED)
                } else {
                    showToast(toast, "success", ERROR_MESSAGES.LOGIN_SUCCESS, ERROR_MESSAGES.DASHBOARD_REDIRECTING);
                    router.push(`${env("NEXT_PUBLIC_LOGIN_REDIRECT_URL")}`);
                }
            } catch (err: any) {
                showToast(toast, "error", ERROR_MESSAGES.LOGIN_ERROR, err?.data?.message || ERROR_MESSAGES.AUTHENICATION__FAILED);
            }
        };

        handleOAuthAuthentication();
    }, [router]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <h2 className="text-red-500 text-xl font-semibold">{error}</h2>
            </div>
        );
    }
    return (
        <div>
            <Toast ref={toast} />
            <ProgressSpinner />
        </div>
    )
}
