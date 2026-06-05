import { useCallback, useEffect } from "react";
import { solidGet } from "../../http/solidHttp";
import { toLegacySettingsShape } from "../../helpers/settingsPayload";
import { env } from "../../adapters/env";

const FAVICON_LINK_ID = "solid-dynamic-favicon";
export const SOLID_SETTINGS_UPDATED_EVENT = "solid:settings-updated";

const normalizeAssetUrl = (src?: string | null) => {
    if (!src) return "";
    if (src.startsWith("blob:") || src.startsWith("http") || src.startsWith("/")) return src;
    return `${env("API_URL")}/${src}`;
};

const applyFavicon = (href: string) => {
    if (typeof document === "undefined" || !href) return;

    document.head
        .querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"]')
        .forEach((link) => {
            if (link.id !== FAVICON_LINK_ID) link.parentNode?.removeChild(link);
        });

    let link = document.getElementById(FAVICON_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement("link");
        link.id = FAVICON_LINK_ID;
        link.rel = "icon";
        document.head.appendChild(link);
    }
    link.href = href;
};

export const SolidFaviconProvider = () => {
    const refresh = useCallback(async () => {
        try {
            const response = await solidGet("/setting/wrapped");
            const settings = toLegacySettingsShape(response?.data ?? null);
            const favicon = settings?.data?.favicon;
            const href = normalizeAssetUrl(favicon);
            if (href) applyFavicon(href);
        } catch (error) {
            console.error("[SolidFaviconProvider] Failed to load favicon setting", error);
        }
    }, []);

    useEffect(() => {
        refresh();
        const handler = () => refresh();
        window.addEventListener(SOLID_SETTINGS_UPDATED_EVENT, handler);
        return () => window.removeEventListener(SOLID_SETTINGS_UPDATED_EVENT, handler);
    }, [refresh]);

    return null;
};
