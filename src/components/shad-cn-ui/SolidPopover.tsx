import * as React from "react";

type SolidPopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SolidPopoverContext = React.createContext<SolidPopoverContextValue | null>(null);
const SOLID_POPOVER_EVENT = "solid-popover-open";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SolidPopoverContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
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

export function SolidPopover({
  open,
  onOpenChange,
  children,
  autoCloseGroup,
}: SolidPopoverProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
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
      if (!root || root.contains(event.target as Node)) return;
      handleSetOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [currentOpen, handleSetOpen]);

  return (
    <SolidPopoverContext.Provider value={{ open: currentOpen, setOpen: handleSetOpen }}>
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
  { className, children, sideOffset = 4, align = "end", side = "bottom", style, ...props },
  ref
) {
  const ctx = React.useContext(SolidPopoverContext);
  if (!ctx || !ctx.open) return null;

  const offsetValue = `${sideOffset}px`;
  const contentStyle: SolidPopoverContentStyle = {
    ...(style ?? {}),
    ["--solid-popover-side-offset"]: offsetValue,
  };

  return (
    <div
      ref={ref}
      className={cx("solid-popover-content", className)}
      role="dialog"
      data-align={align}
      data-side={side}
      style={contentStyle}
      {...props}
    >
      {children}
    </div>
  );
});
