import { useState } from "react";
import { AlertTriangle, CheckCircle, Copy } from "lucide-react";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
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
    <SolidDialog open={open} onOpenChange={handleClose} dismissible={false} style={{ maxWidth: 520 }}>
      <SolidDialogHeader>
        <SolidDialogTitle>API Key Created</SolidDialogTitle>
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody>
        <div className="solid-api-key-reveal-warning flex align-items-start gap-2 mb-4">
          <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
          <p className="m-0" style={{ fontSize: 13 }}>
            <strong>Copy this key now.</strong> It will not be shown again once you close this dialog. Store it somewhere secure.
          </p>
        </div>

        <p className="form-field-label mb-2">
          {keyName}
        </p>

        <div
          className="solid-api-key-reveal-box flex align-items-center gap-2 p-3"
          style={{
            background: "var(--solid-surface-secondary, #f5f5f5)",
            borderRadius: 6,
            border: "1px solid var(--solid-border-color, #e0e0e0)",
          }}
        >
          <code
            className="flex-1"
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {apiKey}
          </code>
          <button
            type="button"
            title={copied ? "Copied!" : "Copy to clipboard"}
            onClick={handleCopy}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {copied ? (
              <CheckCircle size={16} style={{ color: "var(--solid-success-color, #22c55e)" }} />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>

        {copied && (
          <p className="m-0 mt-2" style={{ fontSize: 12, color: "var(--solid-success-color, #22c55e)" }}>
            Copied to clipboard!
          </p>
        )}
      </SolidDialogBody>
      <SolidDialogSeparator />
      <SolidDialogFooter>
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
