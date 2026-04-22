import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";

type SlideType = "image" | "video" | "audio";

export interface SolidLightboxSlide {
  src: string;
  type?: SlideType;
  mimeType?: string;
  poster?: string;
  downloadUrl?: string;
}

export interface SolidLightboxProps {
  slides: SolidLightboxSlide[];
  open: boolean;
  onClose: () => void;
  viewerOptions?: Viewer.Options;
}

export const SolidLightbox = ({
  slides,
  open,
  onClose,
  viewerOptions,
}: SolidLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  const sanitizedSlides = useMemo(
    () => slides.filter((slide) => !!slide?.src),
    [slides]
  );

  const hasOnlyImages = useMemo(
    () => sanitizedSlides.every((slide) => (slide.type ?? "image") === "image"),
    [sanitizedSlides]
  );

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open, sanitizedSlides]);

  useEffect(() => {
    if (!hasOnlyImages || !open) {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      return;
    }

    if (!containerRef.current || sanitizedSlides.length === 0) return;

    if (viewerRef.current) {
      viewerRef.current.destroy();
    }

    viewerRef.current = new Viewer(containerRef.current, {
      navbar: sanitizedSlides.length > 1,
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

    viewerRef.current.show();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [sanitizedSlides, hasOnlyImages, open]);

  if (!open || sanitizedSlides.length === 0) {
    return null;
  }

  if (hasOnlyImages) {
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
        {sanitizedSlides.map((slide, index) => (
          <img key={index} src={slide.src} alt={`preview-${index}`} />
        ))}
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sanitizedSlides.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === sanitizedSlides.length - 1 ? 0 : prev + 1
    );
  };

  const currentSlide = sanitizedSlides[currentIndex];
  const showNav = sanitizedSlides.length > 1;

  const renderSlide = () => {
    const mediaType = currentSlide?.type ?? "image";
    if (mediaType === "video") {
      return (
        <video
          key={currentSlide.src}
          controls
          autoPlay
          style={{ maxWidth: "90vw", maxHeight: "80vh" }}
          poster={currentSlide.poster}
        >
          <source
            src={currentSlide.src}
            type={currentSlide.mimeType || "video/mp4"}
          />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (mediaType === "audio") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              color: "#fff",
            }}
          >
            ♪
          </div>
          <audio controls autoPlay preload="auto" style={{ width: "320px" }}>
            <source
              src={currentSlide.src}
              type={currentSlide.mimeType || "audio/mpeg"}
            />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    return (
      <img
        key={currentSlide.src}
        src={currentSlide.src}
        alt="lightbox-media"
        style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }}
      />
    );
  };

  return (
    <div style={overlayStyles}>
      <button style={closeButtonStyles} onClick={onClose} aria-label="Close">
        ×
      </button>
      {showNav && (
        <>
          <button
            style={navButtonStyles("left")}
            onClick={handlePrev}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            style={navButtonStyles("right")}
            onClick={handleNext}
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
      <div style={contentStyles}>{renderSlide()}</div>
    </div>
  );
};

const overlayStyles: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
};

const contentStyles: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "16px",
};

const closeButtonStyles: CSSProperties = {
  position: "absolute",
  top: "16px",
  right: "24px",
  fontSize: "2rem",
  color: "#fff",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const navButtonStyles = (direction: "left" | "right"): CSSProperties => {
  const baseStyles: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "2.5rem",
    color: "#fff",
    background: "rgba(0,0,0,0.4)",
    border: "none",
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    cursor: "pointer",
  };

  if (direction === "left") {
    baseStyles.left = "24px";
  } else {
    baseStyles.right = "24px";
  }

  return baseStyles;
};
