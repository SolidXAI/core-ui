const DEFAULT_FILESYSTEM_MEDIA_PATH = "/media-files-storage/";
const PRIVATE_MEDIA_DOWNLOAD_PATH = /^\/api\/media\/\d+\/download$/;
const AWS_S3_HOST_PATTERN = /(^|\.)amazonaws\.com$/i;

const shouldAppendAttachmentDisposition = (downloadUrl: URL) => {
    if (downloadUrl.protocol === "blob:") {
        return false;
    }

    if (AWS_S3_HOST_PATTERN.test(downloadUrl.hostname)) {
        return false;
    }

    return downloadUrl.pathname.includes(DEFAULT_FILESYSTEM_MEDIA_PATH)
        || PRIVATE_MEDIA_DOWNLOAD_PATH.test(downloadUrl.pathname);
};

const triggerBrowserDownload = (url: string, fileName?: string) => {
    const link = document.createElement("a");
    const downloadUrl = new URL(url, window.location.origin);

    if (shouldAppendAttachmentDisposition(downloadUrl)) {
        downloadUrl.searchParams.set("disposition", "attachment");
    }

    link.href = downloadUrl.toString();
    link.download = fileName || "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const downloadMediaFile = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
        return;
    }

    triggerBrowserDownload(fileUrl, fileName);
};
