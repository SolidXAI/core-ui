import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type SolidDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
  style?: React.CSSProperties;
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
}: SolidDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cx("solid-radix-dialog-overlay", overlayClassName)} />
        <Dialog.Content
          className={cx("solid-radix-dialog-content", className, contentClassName)}
          style={style}
        >
          {children}
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
  "aria-label": ariaLabel = "Close dialog",
}: {
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Dialog.Close asChild>
      <button
        type="button"
        className={cx("solid-radix-dialog-close", className)}
        aria-label={ariaLabel}
      >
        {children ?? <X size={16} />}
      </button>
    </Dialog.Close>
  );
}
