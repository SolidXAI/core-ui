import { ERROR_MESSAGES } from '../../constants/error-messages';
import { signInWithOAuthAccessCode } from "../../adapters/auth/index";
import { useRouter } from "../../hooks/useRouter";
import { useSearchParams } from "../../hooks/useSearchParams";
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { env } from "../../adapters/env";
import { showToast } from "../../redux/features/toastSlice";
import { loadSession } from "../../adapters/auth/storage";
import { hasAnyRole } from "../../helpers/rolesHelper";
import { SolidSpinner } from "../shad-cn-ui";

export const MicrosoftAuthChecking = () => {
    const searchParams = useSearchParams();
    const accessCode = searchParams.get("accessCode");

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        const handleOAuthAuthentication = async () => {
            if (!accessCode) {
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: ERROR_MESSAGES.AUTHENICATION__FAILED }));
                setError(ERROR_MESSAGES.AUTHENICATION__FAILED);
                return;
            }

            try {
                const response = await signInWithOAuthAccessCode({
                    accessCode: accessCode,
                    provider: "microsoft"
                });

                if (response?.error) {
                    dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: response.error }));
                    setError(ERROR_MESSAGES.AUTHENICATION__FAILED)
                } else {
                    dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.LOGIN_SUCCESS, detail: ERROR_MESSAGES.DASHBOARD_REDIRECTING }));
                    const session = loadSession();
                    const isAdmin = hasAnyRole(session?.user?.roles, ["Admin"]);
                    const isDev = env("VITE_SOLIDX_ENV") === "dev";
                    const redirectUrl = isAdmin && isDev ? "/studio" : (env("NEXT_PUBLIC_LOGIN_REDIRECT_URL") || "/admin");
                    router.push(redirectUrl);
                }
            } catch (err: any) {
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: err?.data?.message || ERROR_MESSAGES.AUTHENICATION__FAILED }));
            }
        };

        handleOAuthAuthentication();
    }, [accessCode, router]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <h2 className="text-red-500 text-xl font-semibold">{error}</h2>
            </div>
        );
    }
    return (
        <SolidSpinner className="flex items-center justify-center min-h-screen" />
    )
}
