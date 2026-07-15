import { getSession } from "../adapters/auth";
import { env } from "../adapters/env";

export type ResolvedMediaUrl = {
    url: string;
    revoke?: () => void;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const backendRoot = trimTrailingSlash(env("NEXT_PUBLIC_BACKEND_API_URL"));
const backendApiRoot = backendRoot ? `${backendRoot}/api` : "";
const protectedMediaPathPattern = /^\/(?:api\/)?media\/[^/]+\/download(?:[/?#]|$)/;

// Checks whether a URL already includes an absolute protocol and host.
const isAbsoluteUrl = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

// Detects whether a media URL points to the signed private download route.
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

// Normalizes media paths into absolute browser-safe URLs.
export const getAbsoluteMediaUrl = (value?: string): string => {
    if (!value) return "";
    if (value.startsWith("blob:") || value.startsWith("data:")) {
        return value;
    }

    let resolvedUrl = value;

    if (!isAbsoluteUrl(value)) {
        if (!backendRoot) {
            return value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
        }

        if (value.startsWith("/api/")) {
            resolvedUrl = `${backendRoot}${value}`;
        } else if (value.startsWith("/media/")) {
            resolvedUrl = `${backendApiRoot}${value}`;
        } else if (value.startsWith("/")) {
            resolvedUrl = `${backendRoot}${value}`;
        } else {
            resolvedUrl = `${backendRoot}/${value.replace(/^\/+/, "")}`;
        }
    }

    return new URL(resolvedUrl).toString();
};

// Opens a media URL in a new tab for direct browser handling.
export const openMediaInNewTab = async (value?: string) => {
    if (typeof window === "undefined") {
        return;
    }

    const url = getAbsoluteMediaUrl(value);
    if (!url) {
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
};

// Resolves preview URLs and converts protected media into temporary blob URLs.
export const resolveMediaPreviewUrl = async (value?: string): Promise<ResolvedMediaUrl> => {
    const absoluteUrl = getAbsoluteMediaUrl(value);
    if (!absoluteUrl || !isProtectedMediaUrl(value)) {
        return { url: absoluteUrl };
    }

    const session = await getSession();
    const headers = new Headers();
    if (session?.user?.accessToken) {
        headers.set("Authorization", `Bearer ${session.user.accessToken}`);
    }

    const response = await fetch(absoluteUrl, { headers });
    if (!response.ok) {
        throw new Error(`Failed to resolve media preview: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { url: objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) };
};
