import * as React from "react";
import { createPortal } from "react-dom";

type SolidPopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  rootRef: React.MutableRefObject<HTMLDivElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
};

const SolidPopoverContext = React.createContext<SolidPopoverContextValue | null>(null);
const SOLID_POPOVER_EVENT = "solid-popover-open";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    ref.current = value;
  }
}

type SolidPopoverContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  portal?: boolean;
};

type SolidPopoverContentStyle = React.CSSProperties & {
  ["--solid-popover-side-offset"]?: string;
};

type SolidPopoverProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  autoCloseGroup?: string;
};

type PopoverPosition = {
  left: number;
  top: number;
  side: "top" | "right" | "bottom" | "left";
};

const POPOVER_VIEWPORT_OFFSET = 8;
const POPOVER_PORTAL_Z_INDEX = 100000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolvePopoverPosition({
  triggerRect,
  contentRect,
  side,
  align,
  sideOffset,
}: {
  triggerRect: DOMRect;
  contentRect: DOMRect;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  sideOffset: number;
}): PopoverPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const availableTop = triggerRect.top;
  const availableBottom = viewportHeight - triggerRect.bottom;
  const availableLeft = triggerRect.left;
  const availableRight = viewportWidth - triggerRect.right;

  let resolvedSide = side;

  if (side === "bottom" && availableBottom < contentRect.height + sideOffset && availableTop > availableBottom) {
    resolvedSide = "top";
  } else if (side === "top" && availableTop < contentRect.height + sideOffset && availableBottom > availableTop) {
    resolvedSide = "bottom";
  } else if (side === "right" && availableRight < contentRect.width + sideOffset && availableLeft > availableRight) {
    resolvedSide = "left";
  } else if (side === "left" && availableLeft < contentRect.width + sideOffset && availableRight > availableLeft) {
    resolvedSide = "right";
  }

  let top = triggerRect.bottom + sideOffset;
  let left = triggerRect.left;

  if (resolvedSide === "bottom" || resolvedSide === "top") {
    if (align === "center") {
      left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
    } else if (align === "end") {
      left = triggerRect.right - contentRect.width;
    }

    top = resolvedSide === "bottom"
      ? triggerRect.bottom + sideOffset
      : triggerRect.top - contentRect.height - sideOffset;
  } else {
    if (align === "center") {
      top = triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2);
    } else if (align === "end") {
      top = triggerRect.bottom - contentRect.height;
    }

    left = resolvedSide === "right"
      ? triggerRect.right + sideOffset
      : triggerRect.left - contentRect.width - sideOffset;
  }

  return {
    left: clamp(left, POPOVER_VIEWPORT_OFFSET, Math.max(POPOVER_VIEWPORT_OFFSET, viewportWidth - contentRect.width - POPOVER_VIEWPORT_OFFSET)),
    top: clamp(top, POPOVER_VIEWPORT_OFFSET, Math.max(POPOVER_VIEWPORT_OFFSET, viewportHeight - contentRect.height - POPOVER_VIEWPORT_OFFSET)),
    side: resolvedSide,
  };
}

export function SolidPopover({
  open,
  onOpenChange,
  children,
  autoCloseGroup,
}: SolidPopoverProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const popoverId = React.useId();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const currentOpen = isControlled ? !!open : internalOpen;

  const handleSetOpen = React.useCallback((next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
    if (next && autoCloseGroup && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(SOLID_POPOVER_EVENT, { detail: { id: popoverId, group: autoCloseGroup } })
      );
    }
  }, [autoCloseGroup, isControlled, onOpenChange, popoverId]);

  React.useEffect(() => {
    if (!autoCloseGroup || typeof window === "undefined") return;
    const handleExternalOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; group?: string }>).detail;
      if (!detail || detail.group !== autoCloseGroup) return;
      if (detail.id === popoverId) return;
      handleSetOpen(false);
    };
    window.addEventListener(SOLID_POPOVER_EVENT, handleExternalOpen as EventListener);
    return () => {
      window.removeEventListener(SOLID_POPOVER_EVENT, handleExternalOpen as EventListener);
    };
  }, [autoCloseGroup, handleSetOpen, popoverId]);

  React.useEffect(() => {
    if (!currentOpen || typeof document === "undefined") return;
    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      const content = contentRef.current;
      const target = event.target as Node;
      if (!root || root.contains(target) || content?.contains(target)) return;
      handleSetOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [currentOpen, handleSetOpen]);

  return (
    <SolidPopoverContext.Provider value={{ open: currentOpen, setOpen: handleSetOpen, rootRef, contentRef }}>
      <div className="solid-popover-root" ref={rootRef}>
        {children}
      </div>
    </SolidPopoverContext.Provider>
  );
}

export function SolidPopoverTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const ctx = React.useContext(SolidPopoverContext);
  if (!ctx) return null;

  const child = asChild && React.isValidElement(children)
    ? React.cloneElement(children as any, {
        onClick: (event: React.MouseEvent) => {
          (children as any).props?.onClick?.(event);
          if (event.defaultPrevented) return;
          ctx.setOpen(!ctx.open);
        },
      })
    : (
      <button
        type="button"
        onClick={() => ctx.setOpen(!ctx.open)}
        className="solid-popover-trigger"
      >
        {children}
      </button>
    );

  return child as any;
}

export const SolidPopoverContent = React.forwardRef<HTMLDivElement, SolidPopoverContentProps>(function SolidPopoverContent(
  { className, children, sideOffset = 4, align = "end", side = "bottom", style, portal = true, ...props },
  ref
) {
  const ctx = React.useContext(SolidPopoverContext);
  if (!ctx || !ctx.open) return null;

  const localRef = React.useRef<HTMLDivElement | null>(null);
  const [portalPosition, setPortalPosition] = React.useState<PopoverPosition | null>(null);

  const attachRef = React.useCallback((node: HTMLDivElement | null) => {
    localRef.current = node;
    ctx.contentRef.current = node;
    assignRef(ref, node);
  }, [ctx.contentRef, ref]);

  React.useLayoutEffect(() => {
    if (!portal || typeof window === "undefined") {
      setPortalPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = ctx.rootRef.current;
      const content = localRef.current;
      if (!trigger || !content) return;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const nextPosition = resolvePopoverPosition({ triggerRect, contentRect, side, align, sideOffset });

      setPortalPosition(nextPosition);
    };

    const rafId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => updatePosition())
      : null;

    if (observer) {
      if (ctx.rootRef.current) observer.observe(ctx.rootRef.current);
      if (localRef.current) observer.observe(localRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      observer?.disconnect();
    };
  }, [align, ctx.rootRef, portal, side, sideOffset]);

  const offsetValue = `${sideOffset}px`;
  const contentStyle = React.useMemo<SolidPopoverContentStyle>(() => {
    if (!portal) {
      return {
        ...(style ?? {}),
        ["--solid-popover-side-offset"]: offsetValue,
      };
    }

    return {
      ...(style ?? {}),
      ["--solid-popover-side-offset"]: offsetValue,
      position: "fixed",
      top: portalPosition?.top ?? 0,
      left: portalPosition?.left ?? 0,
      right: "auto",
      bottom: "auto",
      transform: "none",
      zIndex: POPOVER_PORTAL_Z_INDEX,
      pointerEvents: "auto",
      visibility: portalPosition ? "visible" : "hidden",
    };
  }, [offsetValue, portal, portalPosition, style]);

  const content = (
    <div
      ref={attachRef}
      className={cx("solid-popover-content", className)}
      role="dialog"
      data-align={align}
      data-side={portalPosition?.side ?? side}
      data-portal={portal ? "true" : "false"}
      style={contentStyle}
      {...props}
    >
      {children}
    </div>
  );

  return portal && typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
});
