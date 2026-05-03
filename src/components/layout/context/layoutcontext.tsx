
import React, { useState, createContext } from 'react';
import { LayoutState, ChildContainerProps, LayoutConfig, LayoutContextProps } from '../../../types';
export const LayoutContext = createContext({} as LayoutContextProps);

export const LayoutProvider = ({ children }: ChildContainerProps) => {
    const THEME_STORAGE_KEY = "solidx.theme.mode";
    const getInitialThemeMode = (): "light" | "dark" => {
        if (typeof window === "undefined") return "light";

        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "dark" || stored === "light") {
            return stored;
        }

        return "light";
    };

    const [themeMode, setThemeMode] = useState<"light" | "dark">(getInitialThemeMode);
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        inputStyle: 'outlined',
        colorScheme: themeMode,
        theme: 'solid-light-purple',
        scale: 14,
        authLayout: 'Center'
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    });

    const onMenuToggle = () => {

        if (isDesktop()) {
            setLayoutState((prevLayoutState:any) => ({ ...prevLayoutState, staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prevLayoutState:any) => ({ ...prevLayoutState, staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive }));
        }
    };

    const showProfileSidebar = () => {
        setLayoutState((prevLayoutState:any) => ({ ...prevLayoutState, profileSidebarVisible: !prevLayoutState.profileSidebarVisible }));
    };

    const toggleThemeMode = () => {
        setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    const isDesktop = () => {
        return window.innerWidth > 991;
    };

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
        document.documentElement.classList.toggle("dark", themeMode === "dark");
        document.documentElement.setAttribute("data-theme", themeMode);
        setLayoutConfig((prevLayoutConfig: LayoutConfig) => ({
            ...prevLayoutConfig,
            colorScheme: themeMode
        }));
    }, [themeMode]);

    const value: LayoutContextProps = {
        layoutConfig,
        setLayoutConfig,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showProfileSidebar
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
