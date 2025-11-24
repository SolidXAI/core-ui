/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { ChildContainerProps, LayoutState } from '@/types';
import { usePathname, useSearchParams } from 'next/navigation';
import { PrimeReactContext } from 'primereact/api';
import { useEventListener, useUnmountEffect } from 'primereact/hooks';
import { classNames } from 'primereact/utils';
import React, { useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import AppConfig from './AppConfig';
import { LayoutContext } from './context/layoutcontext';
import AppSidebar from './AppSidebar';
import SolidPopupContainer from '../common/SolidPopupContainer';
import { useSession } from 'next-auth/react';
import { getExtensionFunction } from '@/helpers/registry';
import { SolidOnApplicationMountEvent } from '@/types/solid-core';

export const Layout = ({ children }: ChildContainerProps) => {
    const { layoutConfig, layoutState, setLayoutState } = useContext(LayoutContext);
    const { setRipple } = useContext(PrimeReactContext);
    // const topbarRef = useRef<AppTopbarRef>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
        type: 'click',
        listener: (event) => {
            const isOutsideClicked = !(
                sidebarRef.current?.isSameNode(event.target as Node) ||
                sidebarRef.current?.contains(event.target as Node)
                // topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
                // topbarRef.current?.menubutton?.contains(event.target as Node)
            );

            if (isOutsideClicked) {
                hideMenu();
            }
        }
    });

    const pathname = usePathname();
    const searchParams = useSearchParams();
    useEffect(() => {
        hideMenu();
        hideProfileMenu();
    }, [pathname, searchParams]);

    // const [bindProfileMenuOutsideClickListener, unbindProfileMenuOutsideClickListener] = useEventListener({
    //     type: 'click',
    //     listener: (event) => {
    //         const isOutsideClicked = !(
    //             topbarRef.current?.topbarmenu?.isSameNode(event.target as Node) ||
    //             topbarRef.current?.topbarmenu?.contains(event.target as Node) ||
    //             topbarRef.current?.topbarmenubutton?.isSameNode(event.target as Node) ||
    //             topbarRef.current?.topbarmenubutton?.contains(event.target as Node)
    //         );

    //         if (isOutsideClicked) {
    //             hideProfileMenu();
    //         }
    //     }
    // });

    const hideMenu = () => {
        setLayoutState((prevLayoutState: LayoutState) => ({
            ...prevLayoutState,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false
        }));
        unbindMenuOutsideClickListener();
        unblockBodyScroll();
    };

    const hideProfileMenu = () => {
        setLayoutState((prevLayoutState: LayoutState) => ({
            ...prevLayoutState,
            profileSidebarVisible: false
        }));
        // unbindProfileMenuOutsideClickListener();
    };

    const blockBodyScroll = (): void => {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    };

    const unblockBodyScroll = (): void => {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    };

    useEffect(() => {
        if (layoutState.overlayMenuActive || layoutState.staticMenuMobileActive) {
            bindMenuOutsideClickListener();
        }

        layoutState.staticMenuMobileActive && blockBodyScroll();
    }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive]);

    // useEffect(() => {
    //     if (layoutState.profileSidebarVisible) {
    //         bindProfileMenuOutsideClickListener();
    //     }
    // }, [layoutState.profileSidebarVisible]);

    useUnmountEffect(() => {
        unbindMenuOutsideClickListener();
        // unbindProfileMenuOutsideClickListener();
    });

    const containerClass = classNames('layout-wrapper', {
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive,
        'p-input-filled': layoutConfig.inputStyle === 'filled',
    });
    const { visibleNavbar } = useSelector((state: any) => state.navbarState); // Get the visibility state of sidebar-two


    const { user } = useSelector((state: any) => state.auth);
    const session = useSession();
const hasRunRef = useRef(false);

useEffect(() => {
    // Prevent double execution caused by React Strict Mode
    if (hasRunRef.current) return;
    // @ts-ignore
    if (session == "undefined" || !user) return;
    // Detect full reload (F5, browser reload)
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const isReload = navEntry?.type === "reload";

    if (!isReload) return;

    hasRunRef.current = true;  // Mark as executed

    const handleDynamicFunction = async () => {
        const dynamicHeader = process.env.SOLIDX_ON_APPLICATION_MOUNT_HANDLER;
        let DynamicFunctionComponent = null;

        const event: SolidOnApplicationMountEvent = {
            type: 'onApplicationMount',
            user: user,
            session: session
        };

        if (dynamicHeader) {
            DynamicFunctionComponent = getExtensionFunction(dynamicHeader);
            if (DynamicFunctionComponent) {
                await DynamicFunctionComponent(event);
            }
        }
    };

    handleDynamicFunction();
}, [session.status, session.data, user]);




    return (
        <React.Fragment>
            <div className={containerClass}>
                {/* {process.env.NEXT_PUBLIC_ENABLE_CUSTOM_HEADER_FOOTER == "true" && <CustomHeader />} */}
                <AppSidebar />
                <SolidPopupContainer></SolidPopupContainer>
                <div className={`main-content ${visibleNavbar ? "shifted" : ""}`}>
                    {children}
                    {/* {process.env.NEXT_PUBLIC_ENABLE_CUSTOM_HEADER_FOOTER == "true" && <CustomFooter />} */}
                </div>
                <AppConfig />
                <div className="layout-mask"></div>
            </div>
        </React.Fragment>
    );
};
