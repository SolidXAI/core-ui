const triggerBrowserDownload = (url: string, fileName?: string) => {
    const link = document.createElement("a");
    const downloadUrl = new URL(url, window.location.origin);
    downloadUrl.searchParams.set("disposition", "attachment");
    link.href = downloadUrl.toString();
    link.download = fileName || "";
    document.body.appendChild(link);
    link.click()    ;
    document.body.removeChild(link);
};

export const downloadMediaFile = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
        return;
    }

    triggerBrowserDownload(fileUrl, fileName);
};
