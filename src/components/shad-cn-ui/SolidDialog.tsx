import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type SolidDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
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
    if (!dismissible && !next) return;
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
            if (!dismissible) event.preventDefault();
          }}
          onInteractOutside={(event: any) => {
            if (!dismissible) event.preventDefault();
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
