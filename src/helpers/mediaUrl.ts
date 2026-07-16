import { env } from "../adapters/env";

const protectedMediaPathPattern = /^\/(?:api\/)?media\/[^/]+\/download(?:[/?#]|$)/;
const baseUrl = env("NEXT_PUBLIC_BACKEND_API_URL") || env("API_URL");

const isAbsoluteUrl = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

export const isProtectedMediaUrl = (value?: string): boolean => {
    if (!value) return false;

    if (protectedMediaPathPattern.test(value)) {
        return true;
    }

    if (isAbsoluteUrl(value)) {
        try {
            return protectedMediaPathPattern.test(new URL(value).pathname);
        } catch {
            return false;
        }
    }

    return false;
};

export const getAbsoluteMediaUrl = (value?: string): string => {
    if (!value) return "";
    if (value.startsWith("blob:") || value.startsWith("data:") || isAbsoluteUrl(value)) {
        return value;
    }

    if (!baseUrl) {
        return value;
    }

    const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, "");
    if (value.startsWith("/")) {
        return `${normalizedBaseUrl}${value}`;
    }

    return `${normalizedBaseUrl}/${value.replace(/^\/+/, "")}`;
};

export const openMediaInNewTab = (value?: string) => {
    if (typeof window === "undefined") {
        return;
    }

    const url = getAbsoluteMediaUrl(value);
    if (!url) {
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
};
