import React, { useEffect, useRef, useState } from "react";

type SolidMaterialSymbolProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  size?: number | string;
  fallback?: React.ReactNode;
  onSupportChange?: (supported: boolean) => void;
};

const MATERIAL_SYMBOL_WIDTH_MULTIPLIER = 2.25;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function getSizeInPixels(size: number | string, computedFontSize: string): number {
  if (typeof size === "number") {
    return size;
  }

  const explicitSize = Number.parseFloat(size);
  if (Number.isFinite(explicitSize)) {
    return explicitSize;
  }

  const computedSize = Number.parseFloat(computedFontSize);
  return Number.isFinite(computedSize) ? computedSize : 24;
}

export const SolidMaterialSymbol = ({
  name,
  size = 24,
  className,
  style,
  fallback = null,
  onSupportChange,
  ...rest
}: SolidMaterialSymbolProps) => {
  const symbolRef = useRef<HTMLSpanElement | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let frameId = 0;

    const measureSupport = () => {
      const node = symbolRef.current;
      if (!node) return;

      const computedStyle = window.getComputedStyle(node);
      const sizePx = getSizeInPixels(size, computedStyle.fontSize);
      const renderedWidth = Math.max(node.scrollWidth, node.getBoundingClientRect().width);
      const supported = renderedWidth <= sizePx * MATERIAL_SYMBOL_WIDTH_MULTIPLIER;

      setIsSupported((previousValue) => previousValue === supported ? previousValue : supported);
      onSupportChange?.(supported);
    };

    frameId = window.requestAnimationFrame(measureSupport);
    return () => window.cancelAnimationFrame(frameId);
  }, [className, name, onSupportChange, size]);

  if (isSupported === false) {
    return <>{fallback}</>;
  }

  return (
    <span
      {...rest}
      ref={symbolRef}
      className={cx("material-symbols-outlined", className)}
      style={{
        fontFamily: "\"Material Symbols Outlined\"",
        fontWeight: 400,
        fontStyle: "normal",
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "normal",
        textTransform: "none",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        direction: "ltr",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        fontFeatureSettings: "\"liga\"",
        WebkitFontFeatureSettings: "\"liga\"",
        visibility: isSupported === null ? "hidden" : undefined,
        ...style,
      }}
    >
      {name}
    </span>
  );
};
