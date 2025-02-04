/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { ChildContainerProps, LayoutState } from '@/types';
import { usePathname, useSearchParams } from 'next/navigation';
import { PrimeReactContext } from 'primereact/api';
import { useEventListener, useUnmountEffect } from 'primereact/hooks';
import { classNames } from 'primereact/utils';
import React, { useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { CustomFooter } from '../CustomFooter/CustomFooter';
import { CustomHeader } from '../CustomHeader/CustomHeader';
import AppConfig from './AppConfig';
import { LayoutContext } from './context/layoutcontext';
import AppSidebar from './AppSidebar';

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
    const { visibleNavbar } = useSelector((state:any) => state.navbarState); // Get the visibility state of sidebar-two

    return (
        <React.Fragment>
            <div className={containerClass}>
                {process.env.NEXT_PUBLIC_ENABLE_CUSTOM_HEADER_FOOTER == "true" && <CustomHeader />}
                <AppSidebar />
                <div className={`main-content ${visibleNavbar ? "shifted" : ""}`}>
                    {children}
                    {process.env.NEXT_PUBLIC_ENABLE_CUSTOM_HEADER_FOOTER == "true" && <CustomFooter />}
                </div>
                <AppConfig />
                <div className="layout-mask"></div>
            </div>
        </React.Fragment>
    );
};
