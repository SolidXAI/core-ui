import { getSession } from "../adapters/auth";
import { env } from "../adapters/env";

export type ResolvedMediaUrl = {
    url: string;
    revoke?: () => void;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const backendRoot = trimTrailingSlash(env("NEXT_PUBLIC_BACKEND_API_URL"));
const backendApiRoot = backendRoot ? `${backendRoot}/api` : "";
const protectedMediaPathPattern = /^\/(?:api\/)?media\/\d+\/download(?:[/?#]|$)/;

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
    if (!backendRoot) {
        return value;
    }
    if (value.startsWith("/api/")) {
        return `${backendRoot}${value}`;
    }
    if (value.startsWith("/media/")) {
        return `${backendApiRoot}${value}`;
    }
    if (value.startsWith("/")) {
        return `${backendRoot}${value}`;
    }
    return `${backendRoot}/${value.replace(/^\/+/, "")}`;
};

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
