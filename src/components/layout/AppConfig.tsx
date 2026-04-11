import { useContext, useEffect } from "react";
import { AppConfigProps } from "../../types";
import { LayoutContext } from "./context/layoutcontext";

const AppConfig = (_props: AppConfigProps) => {
    const { layoutConfig } = useContext(LayoutContext);

    useEffect(() => {
        const scale = layoutConfig?.scale ?? 15;
        document.documentElement.style.fontSize = `${scale}px`;
    }, [layoutConfig?.scale]);

    return null;
};

export default AppConfig;
