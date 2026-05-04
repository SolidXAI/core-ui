import React from "react";
import {
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "./SolidDialog";
import { SolidButton } from "./SolidButton";

type SolidConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  separatorClassName?: string;
  showSeparator?: boolean;
};

export function SolidConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  separatorClassName,
  showSeparator = false,
}: SolidConfirmDialogProps) {
  return (
    <SolidDialog open={open} onOpenChange={(val) => !val && onCancel()} className={className}>
      <SolidDialogHeader className={headerClassName}>
        <SolidDialogTitle>{title}</SolidDialogTitle>
        <SolidDialogClose aria-label="Close" />
      </SolidDialogHeader>
      {showSeparator ? <SolidDialogSeparator className={separatorClassName} /> : null}
      <SolidDialogBody className={bodyClassName}>{message}</SolidDialogBody>
      <SolidDialogFooter className={footerClassName}>
        <SolidButton variant="outline" size="sm" onClick={onCancel}>
          {cancelLabel}
        </SolidButton>
        <SolidButton variant="destructive" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </SolidButton>
      </SolidDialogFooter>
    </SolidDialog>
  );
}
