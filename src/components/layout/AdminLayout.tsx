import { signOut } from "../../adapters/auth/index";
import { useSession } from "../../hooks/useSession";
import { useRouter } from "../../hooks/useRouter";
import { useEffect, useState } from "react";
import { useDispatch } from 'react-redux';
import { showToast } from '../../redux/features/toastSlice';
import { Layout } from "./Layout";
import SolidChangeForcePassword from "../auth/SolidChangeForcePassword";
import { ERROR_MESSAGES } from "../../constants/error-messages";
import { SolidDialog, SolidDivider } from "../shad-cn-ui";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    // const theme = useSelector((state: any) => state.theme.mode);
    const dispatch = useDispatch();
    const { data: session, status } = useSession();
    const [isForcePasswordChange, setIsForcePasswordChange] = useState(false);

    useEffect(() => {
        setIsForcePasswordChange(session?.user?.forcePasswordChange === true);
    }, [session]);

    const router = useRouter();
    useEffect(() => {
        if (status === "loading") return;
        if (!session || session?.error === "RefreshAccessTokenError") {
            dispatch(showToast({ severity: 'error', summary: 'Error', detail: ERROR_MESSAGES.SESSION_EXPIRED }))
            signOut({ callbackUrl: "/auth/login" });
        }
    }, [session, status]);

    return (
        <>
            <Layout>{children}</Layout>
            {isForcePasswordChange && (
                <SolidDialog
                    header="Change Default Password"
                    className="solid-change-dialog"
                    visible={isForcePasswordChange}
                    style={{ width: "25vw" }}
                    onHide={() => setIsForcePasswordChange(false)}
                >
                    <SolidDivider className="mt-0" />
                    <SolidChangeForcePassword />
                </SolidDialog>
            )}
        </>
    );
}
