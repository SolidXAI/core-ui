"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";

export const SolidThemeProvider = () => {
    const pathname = usePathname();
    // const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery()

    // useEffect(() => {
    //     if (pathname.includes("/auth/")) {
    //         trigger("");
    //     }
    // }, [pathname, trigger]);

    const solidSettingsData = useSelector((state: any) => state.settingsState?.solidSettings);

    const [theme, setTheme] = useState("solid-light-purple");
    useEffect(() => {
        if (pathname.includes("/auth/") && solidSettingsData?.authPagesTheme) {
            const selectedTheme =
                solidSettingsData?.authPagesTheme === "dark" ? "solid-dark-purple" : "solid-light-purple";
            setTheme(selectedTheme);
        } else {
            setTheme("solid-light-purple");
        }
    }, [pathname, solidSettingsData]);

    useEffect(() => {
        // Find or create <link> element
        let themeLink = document.getElementById("theme-css") as HTMLLinkElement;

        // if (!themeLink) {
        //     themeLink = document.createElement("link");
        //     themeLink.id = "theme-css";
        //     themeLink.rel = "stylesheet";
        //     document.head.appendChild(themeLink);
        // }

        // Update theme link dynamically
        themeLink.href = `/themes/${theme}/theme.css`;
    }, [theme]);

    return null;
}