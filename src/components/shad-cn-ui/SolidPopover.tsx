import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

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
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Popover.Root>
  );
}

export function SolidPopoverTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  return <Popover.Trigger asChild={asChild}>{children}</Popover.Trigger>;
}

export const SolidPopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Popover.Content>
>(function SolidPopoverContent(
  { className, sideOffset = 6, align = "end", children, ...props },
  ref
) {
  return (
    <Popover.Portal>
      <Popover.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cx("solid-popover-content", className)}
        {...props}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
});

