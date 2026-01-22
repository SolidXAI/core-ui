"use client"

import { handleError } from "@solid-ui/helpers/ToastContainer";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Layout } from "./Layout";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import SolidChangeForcePassword from "../auth/SolidChangeForcePassword";
import { ERROR_MESSAGES } from "@solid-ui/constants/error-messages";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    // const theme = useSelector((state: any) => state.theme.mode);
    const { data: session, status } = useSession();
    const [isForcePasswordChange, setIsForcePasswordChange] = useState(false)
    useEffect(() => {
        // @ts-expect-error: Handling potential case where 'data?.user?.user' might be undefined or null
        if (session?.user?.user?.forcePasswordChange === true) {
            setIsForcePasswordChange(true)
        } else {
            setIsForcePasswordChange(false)
        }
    }, [session])
    // const pathname = usePathname();
    const router = useRouter();
    useEffect(() => {
        if (status === "loading") return;
        if (!session || session?.error === "RefreshAccessTokenError") {
            handleError([ERROR_MESSAGES.SESSION_EXPIRED])
            signOut({ callbackUrl: "/auth/login" });
        }

    }, [session, status])

    return (
        <Layout>
            {/* <div className={`${process.env.NEXT_PUBLIC_ENABLE_CUSTOM_HEADER_FOOTER == "true" && 'header-margin-top'}`} style={{ minHeight: `${process.env.NEXT_PUBLIC_ENABLE_CUSTOM_HEADER_FOOTER == "true" ? 'calc(100vh - 70px)' : 'calc(100vh)'}` }}> */}

            {/* <div className="min-h-full max-h-full flex flex-column relative flex-auto overflow-x-auto"> */}
            {/* <DashboardHeader /> */}
            {/* <SolidListingHeader></SolidListingHeader> */}
            {/* {pathname.includes('all') && <ListingHeader />} */}
            {/* <div className="flex flex-column flex-auto" style={{ backgroundColor: '#f6f6f9', padding: '1.5rem 1.5rem 1.5rem', }}> */}
            {children}
            {/* </div> */}
            {/* </div> */}
            {/* </div> */}
            {isForcePasswordChange &&
                <Dialog header="Change Default Password" className="solid-change-dialog" visible={isForcePasswordChange} closable={false} draggable={false} style={{ width: '25vw' }} onHide={() => setIsForcePasswordChange(false)}>
                    <Divider className="mt-0" />
                    <SolidChangeForcePassword />
                </Dialog>
            }
        </Layout>
    )
}