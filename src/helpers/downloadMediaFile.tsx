const triggerLinkClick = (href: string, fileName?: string, openInNewTab = false) => {
    const link = document.createElement("a");
    link.href = href;

    if (openInNewTab) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
    link.download = fileName || "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Anchor `download` attribute is ignored by browsers for cross-origin URLs
// (e.g. S3), so cross-origin media would open inline instead of downloading.
// Mutating the URL's query params also breaks presigned S3 URLs, since the
// signature is computed over the exact query string at signing time.
// Fetching the file and downloading it via a same-origin blob: URL avoids both issues.
const triggerBrowserDownload = async (url: string, fileName?: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        triggerLinkClick(blobUrl, fileName);
        URL.revokeObjectURL(blobUrl);
    } catch(e) {
        console.error("Failed to download file via fetch, falling back to direct link:", e);
        // Fallback for cases fetch can't handle (e.g. no CORS on the host).
        // This won't force a download for cross-origin URLs, but it's the
        // best available option when the blob fetch fails.
        triggerLinkClick(url, fileName, true);
    }
};

export const downloadMediaFile = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) {
        return;
    }

    void triggerBrowserDownload(fileUrl, fileName);
};
