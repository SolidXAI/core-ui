import { useEffect, useRef, useState } from 'react';
import { SolidButton } from '../../shad-cn-ui/SolidButton';
import { SolidIcon } from '../../shad-cn-ui/SolidIcon';

export interface PDFViewerProps {
    url?: string | null;
    /** Height of the viewport the PDF renders into. */
    height?: string;
}

/**
 * Renders a PDF using the browser's built-in PDF viewer.
 *
 * The signed URL is fetched into a blob first, which both keeps any auth on the
 * request and guarantees inline rendering regardless of the `Content-Disposition`
 * the storage provider sends back. Everything else — zoom, rotation, page
 * navigation, text search/selection, print, download — is handled natively by
 * the browser, so there is no pdf.js worker to configure or version-match.
 */
export default function PDFViewer({ url, height = '70vh' }: PDFViewerProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const blobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!url) return;

        const controller = new AbortController();
        setError(null);
        setBlobUrl(null);

        fetch(url, { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) throw new Error(`Request failed with ${res.status}`);

                const contentType = res.headers.get('content-type') ?? '';
                if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
                    throw new Error(`Unexpected content type: ${contentType}`);
                }

                const blob = await res.blob();
                const nextBlobUrl = URL.createObjectURL(blob);

                // Revoke the URL this one replaces so repeated previews don't leak.
                if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = nextBlobUrl;

                setBlobUrl(nextBlobUrl);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                console.error('PDF load error:', err);
                setError('Failed to load PDF');
            });

        return () => controller.abort();
    }, [url, reloadToken]);

    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, []);

    if (!url) {
        return (
            <div
                className="flex items-center justify-center rounded-lg bg-[var(--solid-surface-pane)]"
                style={{ height }}
            >
                <p className="text-[var(--solid-text-muted)]">No PDF URL provided</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-4 rounded-lg bg-[var(--solid-danger-soft)]"
                style={{ height }}
            >
                <p className="text-[var(--solid-danger)]">{error}</p>
                <SolidButton
                    onClick={() => setReloadToken((t) => t + 1)}
                    leftIcon={<SolidIcon name="si-refresh" size={16} aria-hidden />}
                >
                    Retry
                </SolidButton>
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <div
                className="flex items-center justify-center rounded-lg bg-[var(--solid-surface-pane)]"
                style={{ height }}
            >
                <p className="text-[var(--solid-text-secondary)]">Loading PDF...</p>
            </div>
        );
    }

    return (
        <iframe
            src={blobUrl}
            title="PDF preview"
            className="w-full rounded-lg border border-[var(--solid-border-default)] bg-[var(--solid-surface-pane)]"
            style={{ height }}
        />
    );
}
