import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { SolidButton } from '../../shad-cn-ui/SolidButton';
import { SolidIcon } from '../../shad-cn-ui/SolidIcon';

// Local worker (avoids CORS and CDN/version mismatches)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

type OnDocumentLoadSuccess = NonNullable<DocumentProps['onLoadSuccess']>;
type OnDocumentLoadError = NonNullable<DocumentProps['onLoadError']>;

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

export interface PDFViewerProps {
    url?: string | null;
}

// react-pdf's Page component can throw synchronously out of a passive effect
// (pdf.js worker transport torn down mid-load, e.g. under StrictMode's double
// effect invocation) — that bypasses its own onLoadError callback, so it must
// be caught here instead.
class PdfRenderBoundary extends Component<{ onError: () => void; children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(err: unknown) {
        console.error('PDF render error:', err);
        this.props.onError();
    }

    render() {
        return this.state.hasError ? null : this.props.children;
    }
}

export default function PDFViewer({ url }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const blobUrlRef = useRef<string | null>(null);

    // Fetch signed URL → Blob → Object URL, revoking the previous object URL
    // whenever a new one replaces it (including on unmount) to avoid leaking
    // memory across previews.
    useEffect(() => {
        if (!url) return;

        const controller = new AbortController();
        setLoading(true);
        setError(null);
        setNumPages(null);
        setPageNumber(1);
        setScale(1);
        setRotation(0);

        fetch(url, { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to fetch PDF');

                const contentType = res.headers.get('content-type') ?? '';
                if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
                    throw new Error('Unexpected response type');
                }

                const blob = await res.blob();
                const nextBlobUrl = URL.createObjectURL(blob);

                if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = nextBlobUrl;

                setBlobUrl(nextBlobUrl);
                setLoading(false);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                console.error('Blob fetch error:', err);
                setError('Failed to load PDF');
                setLoading(false);
            });

        return () => controller.abort();
    }, [url, reloadToken]);

    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, []);

    const onDocumentLoadSuccess: OnDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }) => {
        setNumPages(nextNumPages);
        setError(null);
    }, []);

    const onDocumentLoadError: OnDocumentLoadError = useCallback((err) => {
        console.error('PDF load error:', err);
        setError('Failed to render PDF');
    }, []);

    const goToPrevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
    const goToNextPage = () => setPageNumber((p) => Math.min(p + 1, numPages ?? p));
    const zoomIn = () => setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE));
    const zoomOut = () => setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE));
    const rotate = () => setRotation((r) => (r + 90) % 360);
    const retry = () => setReloadToken((t) => t + 1);

    // Keyboard navigation while the viewer is mounted (i.e. its dialog is open).
    useEffect(() => {
        if (!numPages) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') goToPrevPage();
            if (event.key === 'ArrowRight') goToNextPage();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [numPages]);

    const downloadFileName = useMemo(() => `document-${Date.now()}.pdf`, []);

    if (!url) {
        return (
            <div className="flex h-96 items-center justify-center rounded-lg bg-[var(--solid-surface-pane)]">
                <p className="text-[var(--solid-text-muted)]">No PDF URL provided</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            {loading && (
                <div className="flex h-96 w-full items-center justify-center rounded-lg bg-[var(--solid-surface-pane)]">
                    <p className="text-[var(--solid-text-secondary)]">Loading PDF...</p>
                </div>
            )}

            {error && (
                <div className="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-lg bg-[var(--solid-danger-soft)]">
                    <p className="text-[var(--solid-danger)]">{error}</p>
                    <SolidButton onClick={retry} leftIcon={<SolidIcon name="si-refresh" size={16} aria-hidden />}>
                        Retry
                    </SolidButton>
                </div>
            )}

            {blobUrl && !loading && !error && (
                <>
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-lg bg-[var(--solid-surface-card)] p-2 shadow-sm">
                        <SolidButton
                            variant="ghost"
                            size="sm"
                            onClick={zoomOut}
                            disabled={scale <= MIN_SCALE}
                            title="Zoom out"
                        >
                            <SolidIcon name="si-zoom-out" size={16} aria-hidden />
                        </SolidButton>
                        <span className="min-w-[3.5rem] text-center text-sm text-[var(--solid-text-muted)]">
                            {Math.round(scale * 100)}%
                        </span>
                        <SolidButton
                            variant="ghost"
                            size="sm"
                            onClick={zoomIn}
                            disabled={scale >= MAX_SCALE}
                            title="Zoom in"
                        >
                            <SolidIcon name="si-zoom-in" size={16} aria-hidden />
                        </SolidButton>
                        <SolidButton variant="ghost" size="sm" onClick={rotate} title="Rotate">
                            <SolidIcon name="si-rotate-right" size={16} aria-hidden />
                        </SolidButton>
                        <a
                            href={blobUrl}
                            download={downloadFileName}
                            className="solid-btn solid-btn--ghost solid-btn--sm"
                            title="Download"
                        >
                            <SolidIcon name="si-download" size={16} aria-hidden />
                        </a>
                    </div>

                    {/*
                        Deliberately not flex/items-center here: a flex-centered child that
                        overflows its scroll container has its start-side (top/left) overflow
                        rendered unreachable — the scrollable region only ever covers the end
                        side. A plain block with `mx-auto` centers only while the page still
                        fits (auto margins resolve to 0 once it's larger), so zooming in keeps
                        the whole page reachable by scrolling.
                    */}
                    <div className="max-h-[65vh] w-full overflow-auto rounded-lg border border-[var(--solid-border-default)] bg-[var(--solid-surface-pane)] shadow-lg">
                        <PdfRenderBoundary key={blobUrl} onError={() => setError('Failed to render PDF')}>
                            <Document
                                file={blobUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={
                                    <div className="flex h-96 w-full items-center justify-center">
                                        <p className="text-[var(--solid-text-secondary)]">Loading page...</p>
                                    </div>
                                }
                                className="mx-auto w-fit"
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    rotate={rotation}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                />
                            </Document>
                        </PdfRenderBoundary>
                    </div>
                </>
            )}

            {numPages && (
                <div className="flex items-center gap-4 rounded-lg bg-[var(--solid-surface-card)] p-4 shadow-md">
                    <SolidButton onClick={goToPrevPage} disabled={pageNumber <= 1}>
                        Previous
                    </SolidButton>

                    <span className="font-medium text-[var(--solid-text-secondary)]">
                        Page {pageNumber} of {numPages}
                    </span>

                    <SolidButton onClick={goToNextPage} disabled={pageNumber >= numPages}>
                        Next
                    </SolidButton>
                </div>
            )}
        </div>
    );
}
