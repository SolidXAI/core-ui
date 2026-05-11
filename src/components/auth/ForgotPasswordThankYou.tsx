import { useSearchParams } from "../../hooks/useSearchParams";
import { SolidButton } from "../shad-cn-ui";
import { useRouter } from "../../hooks/useRouter";
import { useAuthSettings } from "./AuthSettingsContext";


export const ForgotPasswordThankYou = () => {
    const { solidSettingsData } = useAuthSettings();
    const router = useRouter();

    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const decodedEmail = email ? decodeURIComponent(email) : '';
    return (
        <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
            <h2 className="solid-auth-title">Check your inbox</h2>
            <p className="solid-auth-helper">We sent reset instructions to your registered email address.</p>
            <p className="solid-auth-input-label mt-3" style={{ fontWeight: 600 }}>{decodedEmail}</p>
            <p className="solid-auth-helper">
                Please follow the instructions in the email to continue.
            </p>
            <div className="mt-4">
                <SolidButton className="w-full" onClick={() => router.push("/auth/login")}>
                    Back to Sign In
                </SolidButton>
            </div>
        </div>
    )
}
