import { useState } from "react";
import { AlertTriangle, CheckCircle, Copy } from "lucide-react";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogDescription,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../../shad-cn-ui";

interface RevealApiKeyModalProps {
  open: boolean;
  apiKey: string;
  keyName: string;
  onClose: () => void;
}

export function RevealApiKeyModal({ open, apiKey, keyName, onClose }: RevealApiKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <SolidDialog
      open={open}
      onOpenChange={handleClose}
      dismissible={false}
      style={{ maxWidth: 520 }}
      className="solid-api-key-dialog solid-api-key-dialog--reveal"
    >
      <SolidDialogHeader className="solid-api-key-dialog-header">
        <SolidDialogTitle>API Key Created</SolidDialogTitle>
        <SolidDialogDescription>
          Copy this key now and store it in a secure place before closing this dialog.
        </SolidDialogDescription>
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody className="solid-api-key-dialog-body">
        <div className="solid-api-key-reveal-warning">
          <AlertTriangle size={16} className="solid-api-key-reveal-warning-icon" />
          <p className="m-0">
            <strong>Shown only once.</strong> After this dialog closes, the raw key cannot be retrieved again.
          </p>
        </div>

        <p className="form-field-label mb-2">{keyName}</p>

        <div className="solid-api-key-reveal-box">
          <code className="solid-api-key-reveal-code">{apiKey}</code>
          <button
            type="button"
            title={copied ? "Copied!" : "Copy to clipboard"}
            onClick={handleCopy}
            className="solid-api-key-reveal-copy"
          >
            {copied ? (
              <CheckCircle size={16} className="solid-api-key-reveal-copy-success" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>

        {copied && (
          <p className="solid-api-key-reveal-copied m-0 mt-2">Copied to clipboard.</p>
        )}
      </SolidDialogBody>
      <SolidDialogSeparator />
      <SolidDialogFooter className="solid-api-key-dialog-footer">
        <SolidButton variant="outline" onClick={handleClose}>
          Close
        </SolidButton>
        <SolidButton onClick={handleClose}>
          I've Saved This Key
        </SolidButton>
      </SolidDialogFooter>
    </SolidDialog>
  );
}
