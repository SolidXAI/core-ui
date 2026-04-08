import { signOut } from "../../adapters/auth/index";
import { useSession } from "../../hooks/useSession";
import { useRouter } from "../../hooks/useRouter";
import { useEffect, useState } from "react";
import { useDispatch } from 'react-redux';
import { showToast } from '../../redux/features/toastSlice';
import { Layout } from "./Layout";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import SolidChangeForcePassword from "../auth/SolidChangeForcePassword";
import { ERROR_MESSAGES } from "../../constants/error-messages";

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
                <Dialog
                    header="Change Default Password"
                    className="solid-change-dialog"
                    visible={isForcePasswordChange}
                    closable={false}
                    draggable={false}
                    style={{ width: "25vw" }}
                    onHide={() => setIsForcePasswordChange(false)}
                >
                    <Divider className="mt-0" />
                    <SolidChangeForcePassword />
                </Dialog>
            )}
        </>
    );
}
