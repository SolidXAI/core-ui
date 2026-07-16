const protectedMediaPathPattern = /^\/(?:api\/)?media\/[^/]+\/download(?:[/?#]|$)/;

export const isProtectedMediaUrl = (value?: string): boolean => {
    if (!value) return false;

    if (protectedMediaPathPattern.test(value)) {
        return true;
    }

    try {
        return protectedMediaPathPattern.test(new URL(value).pathname);
    } catch {
        return false;
    }
};

export const openMediaInNewTab = (value?: string) => {
    if (typeof window === "undefined") {
        return;
    }

    if (!value) {
        return;
    }

    window.open(value, "_blank", "noopener,noreferrer");
};
