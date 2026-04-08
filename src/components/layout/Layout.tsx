import { ChildContainerProps } from '../../types';
import React, { useEffect, useRef } from 'react';
import AppSidebar from './AppSidebar';
import SolidPopupContainer from '../common/SolidPopupContainer';
import { GlobalToast } from '../common/GlobalToast';
import { useSession } from "../../hooks/useSession";
import { getExtensionFunction } from '../../helpers/registry';
import { SolidOnApplicationMountEvent } from '../../types/solid-core';
import { env } from "../../adapters/env";
import { AdminTopHeader } from './AdminTopHeader';

export const Layout = ({ children }: ChildContainerProps) => {
    const session = useSession();
    const user = session?.data?.user;
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (hasRunRef.current) return;
        if (!session || !user) return;

        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const isReload = navEntry?.type === "reload";
        const isFirstMount = !sessionStorage.getItem("app-mounted");

        if (isFirstMount || isReload) {
            sessionStorage.setItem("app-mounted", "true");
        } else {
            return;
        }

        hasRunRef.current = true;

        const handleDynamicFunction = async () => {
            const dynamicHeader = env("SOLIDX_ON_APPLICATION_MOUNT_HANDLER");
            const event: SolidOnApplicationMountEvent = {
                type: "onApplicationMount",
                user,
                session: session.data
            };

            if (!dynamicHeader) return;
            const dynamicFunction = getExtensionFunction(dynamicHeader);
            if (dynamicFunction) {
                await dynamicFunction(event);
            }
        };

        handleDynamicFunction();
    }, [session, user]);

    return (
        <div className="solid-shell">
            <AppSidebar />
            <SolidPopupContainer />
            <GlobalToast />
            <main className="solid-main">
                <AdminTopHeader />
                <div className="solid-main-content">
                    {children}
                </div>
            </main>
        </div>
    );
};
