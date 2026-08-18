export interface PDFViewerProps {
    url?: string | null;
    /** Height of the viewport the PDF renders into. */
    height?: string;
}

/**
 * Renders a PDF using the browser's built-in PDF viewer.
 *
 * The signed URL is handed straight to the iframe instead of being fetched into a
 * blob first. `fetch` is subject to CORS, so a blob-based viewer only works where
 * the storage bucket explicitly allows the app's origin — which differs per
 * environment and silently breaks on any bucket that hasn't been configured.
 * Iframes are not subject to CORS, so this renders identically everywhere.
 *
 * Zoom, rotation, page navigation, text search/selection, print and download all
 * come from the browser's native viewer, so there is no pdf.js worker to
 * configure or version-match.
 */
export default function PDFViewer({ url, height = '70vh' }: PDFViewerProps) {
    if (!url) {
        return (
            <div
                className="flex min-h-0 items-center justify-center rounded-lg bg-[var(--solid-surface-pane)]"
                style={{ height }}
            >
                <p className="text-[var(--solid-text-muted)]">No PDF URL provided</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-col gap-2" style={{ height }}>
            <iframe
                src={url}
                title="PDF preview"
                className="block min-h-0 w-full flex-1 rounded-lg border border-[var(--solid-border-default)] bg-[var(--solid-surface-pane)]"
            />
            {/*
                Escape hatch: a browser that won't render PDFs inline (iOS Safari, or
                an object stored with a non-PDF content type) shows a blank frame with
                no error event to hook. This keeps the document reachable in that case.
            */}
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-center text-xs text-[var(--solid-text-muted)] underline"
            >
                Not rendering? Open in a new tab
            </a>
        </div>
    );
}
