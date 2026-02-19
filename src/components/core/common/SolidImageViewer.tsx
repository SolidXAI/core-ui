import { useEffect, useRef } from "react";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";

export interface SolidImageViewerProps {
    images: string[];
    open: boolean;
    onClose: () => void;
    viewerOptions?: Viewer.Options;
}

export const SolidImageViewer = ({
    images,
    open,
    onClose,
    viewerOptions,
}: SolidImageViewerProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<Viewer | null>(null);

    // Initialize viewer
    useEffect(() => {
        if (!containerRef.current || images.length === 0) return;

        if (viewerRef.current) {
            viewerRef.current.destroy();
        }

        viewerRef.current = new Viewer(containerRef.current, {
            navbar: images.length > 1, // show navbar only if multiple
            title: false,
            transition: true,
            movable: true,
            scalable: true,
            rotatable: true,
            zoomable: true,
            zIndex: 9999,
            hidden: () => {
                onClose();
            },
            toolbar: {
                prev: 1,
                next: 1,
                zoomIn: 1,
                zoomOut: 1,
                rotateLeft: 1,
                rotateRight: 1,
                reset: 1,
            },
            ...viewerOptions,
        });

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [images, open]);


    // Show viewer when open becomes true
    useEffect(() => {
        if (open && viewerRef.current) {
            viewerRef.current.show();
        }
    }, [open]);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                visibility: "hidden",
                width: 0,
                height: 0,
                overflow: "hidden",
            }}
        >
            {images.map((src, index) => (
                <img key={index} src={src} alt={`preview-${index}`} />
            ))}
        </div>
    );
};
