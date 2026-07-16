import { getSession } from "../adapters/auth";
import { getAbsoluteMediaUrl, isProtectedMediaUrl } from "./mediaUrl";

const triggerBrowserDownload = (url: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const getFileNameFromDisposition = (contentDisposition: string | null): string => {
    if (!contentDisposition) {
        return "";
    }

    const utfNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfNameMatch?.[1]) {
        return decodeURIComponent(utfNameMatch[1]);
    }

    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return fileNameMatch?.[1] || "";
};

export const downloadMediaFile = async (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
        return;
    }

    if (fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) {
        triggerBrowserDownload(fileUrl, fileName);
        return;
    }

    const absoluteUrl = getAbsoluteMediaUrl(fileUrl);
    const headers = new Headers();
    if (isProtectedMediaUrl(fileUrl)) {
        const session = await getSession();
        if (session?.user?.accessToken) {
            headers.set("Authorization", `Bearer ${session.user.accessToken}`);
        }
    }

    const response = await fetch(absoluteUrl, { headers });
    if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const resolvedName = fileName || getFileNameFromDisposition(response.headers.get("Content-Disposition"));
    triggerBrowserDownload(objectUrl, resolvedName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};
