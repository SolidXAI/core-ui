import React from "react";
import {
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
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
}: SolidConfirmDialogProps) {
  return (
    <SolidDialog open={open} onOpenChange={(val) => !val && onCancel()} className={className}>
      <SolidDialogHeader>
        <SolidDialogTitle>{title}</SolidDialogTitle>
        <SolidDialogClose aria-label="Close" />
      </SolidDialogHeader>
      <SolidDialogBody>{message}</SolidDialogBody>
      <SolidDialogFooter>
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
