
import { useContext, useEffect } from "react";
import { LayoutContext } from "../layout/context/layoutcontext";

export const SolidThemeProvider = () => {
    const layoutContext = useContext(LayoutContext);
    const themeMode = layoutContext?.themeMode === "dark" ? "dark" : "light";
    const theme = themeMode === "dark" ? "solid-dark-purple" : "solid-light-purple";

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
};
