import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type SolidDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
  style?: React.CSSProperties;
  // Compatibility props
  visible?: boolean;
  onHide?: () => void;
  modal?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showHeader?: boolean;
  headerClassName?: string;
  contentStyle?: React.CSSProperties;
  breakpoints?: Record<string, string>;
  dismissible?: boolean;
};

type SolidDialogSectionProps = {
  children: React.ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const DATEPICKER_OUTSIDE_SAFE_SELECTOR =
  "#solid-datepicker-portal, .react-datepicker, .react-datepicker-popper, .react-datepicker__portal, [class*='react-datepicker']";

function isDatePickerInteractionTarget(target: EventTarget | null): boolean {
  if (!target) return false;

  if (target instanceof Element) {
    return Boolean(target.closest(DATEPICKER_OUTSIDE_SAFE_SELECTOR));
  }

  if (target instanceof Node) {
    return Boolean(target.parentElement?.closest(DATEPICKER_OUTSIDE_SAFE_SELECTOR));
  }

  return false;
}

function shouldPreventOutsideDismiss(event: any): boolean {
  const original = event?.detail?.originalEvent ?? event;
  const target = original?.target as EventTarget | null;

  if (isDatePickerInteractionTarget(target)) {
    return true;
  }

  if (typeof original?.composedPath === "function") {
    const path = original.composedPath() as EventTarget[];
    return path.some((node) => isDatePickerInteractionTarget(node));
  }

  return false;
}

export function SolidDialog({
  open,
  onOpenChange,
  children,
  className,
  contentClassName,
  overlayClassName,
  style,
  visible,
  onHide,
  header,
  footer,
  showHeader = true,
  headerClassName,
  contentStyle,
  dismissible = true,
}: SolidDialogProps) {
  const controlledOpen = open ?? visible ?? false;
  const handleOpenChange = (next: boolean) => {
    onOpenChange?.(next);
    if (!next) onHide?.();
  };

  return (
    <Dialog.Root open={controlledOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cx("solid-radix-dialog-overlay", overlayClassName)} />
        <Dialog.Content
          className={cx("solid-radix-dialog-content", className, contentClassName)}
          style={style ?? contentStyle}
          onEscapeKeyDown={(event: any) => {
            if (!dismissible) event.preventDefault();
          }}
          onPointerDownOutside={(event: any) => {
            if (!dismissible) {
              event.preventDefault();
              return;
            }
            if (shouldPreventOutsideDismiss(event)) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event: any) => {
            if (!dismissible) {
              event.preventDefault();
              return;
            }
            if (shouldPreventOutsideDismiss(event)) {
              event.preventDefault();
            }
          }}
        >
          {showHeader && (header || onHide) ? (
            <SolidDialogHeader className={headerClassName}>
              {header ? <SolidDialogTitle>{header}</SolidDialogTitle> : null}
              <SolidDialogClose aria-label="Close" />
            </SolidDialogHeader>
          ) : null}
          {children}
          {footer ? <SolidDialogFooter>{footer}</SolidDialogFooter> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SolidDialogHeader({ children, className }: SolidDialogSectionProps) {
  return <div className={cx("solid-radix-dialog-header", className)}>{children}</div>;
}

export function SolidDialogTitle({ children, className }: SolidDialogSectionProps) {
  return <Dialog.Title className={cx("solid-radix-dialog-title", className)}>{children}</Dialog.Title>;
}

export function SolidDialogDescription({ children, className }: SolidDialogSectionProps) {
  return (
    <Dialog.Description className={cx("solid-radix-dialog-description", className)}>
      {children}
    </Dialog.Description>
  );
}

export function SolidDialogBody({ children, className }: SolidDialogSectionProps) {
  return <div className={cx("solid-radix-dialog-body", className)}>{children}</div>;
}

export function SolidDialogFooter({ children, className }: SolidDialogSectionProps) {
  return <div className={cx("solid-radix-dialog-footer", className)}>{children}</div>;
}

export function SolidDialogSeparator({ className }: { className?: string }) {
  return <div className={cx("solid-radix-dialog-separator", className)} />;
}

export function SolidDialogClose({
  className,
  children,
  onClick,
  "aria-label": ariaLabel = "Close dialog",
}: {
  className?: string;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
}) {
  return (
    <Dialog.Close asChild>
      <button
        type="button"
        className={cx("solid-radix-dialog-close", className)}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {children ?? <X size={16} />}
      </button>
    </Dialog.Close>
  );
}
