import * as React from "react";

type SolidPopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SolidPopoverContext = React.createContext<SolidPopoverContextValue | null>(null);

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidPopover({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const currentOpen = isControlled ? !!open : internalOpen;

  const handleSetOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <SolidPopoverContext.Provider value={{ open: currentOpen, setOpen: handleSetOpen }}>
      <div className="solid-popover-root">{children}</div>
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

export const SolidPopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; align?: "start" | "center" | "end" }
>(function SolidPopoverContent(
  { className, children, ...props },
  ref
) {
  const ctx = React.useContext(SolidPopoverContext);
  if (!ctx || !ctx.open) return null;

  return (
    <div
      ref={ref}
      className={cx("solid-popover-content", className)}
      role="dialog"
      {...props}
    >
      {children}
    </div>
  );
});
