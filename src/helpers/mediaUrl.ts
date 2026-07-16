export const openMediaInNewTab = (value?: string) => {
    if (typeof window === "undefined") {
        return;
    }

    if (!value) {
        return;
    }

    window.open(value, "_blank", "noopener,noreferrer");
};
