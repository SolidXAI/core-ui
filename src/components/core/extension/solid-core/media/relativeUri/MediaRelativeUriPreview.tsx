import React, { useMemo, useState } from "react";
import { ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import PDFViewer from "../../../../common/PDFViewer";
import {
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogHeader,
  SolidDialogTitle,
} from "../../../../../shad-cn-ui/SolidDialog";
import { SolidButton } from "../../../../../shad-cn-ui/SolidButton";
import { getMediaPreviewKind } from "../../../../../../helpers/mediaType";
import { openMediaInNewTab } from "../../../../../../helpers/mediaUrl";
import { SolidFormFieldWidgetProps, SolidMediaListFieldWidgetProps } from "../../../../../../types/solid-core";

type MediaPreviewDetails = {
  url: string;
  mimeType: string;
  fileName: string;
  previewKind: "image" | "video" | "audio" | "file";
  isPdf: boolean;
};

const getFieldValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
};

const getFileUrl = (rowData: any, value: string) => {
  return rowData?._full_url || rowData?.fileUrl || value || "";
};

const isPdfMedia = ({ mimeType, fileName, url }: { mimeType?: string; fileName?: string; url?: string }) => {
  const normalizedMimeType = String(mimeType || "").toLowerCase();
  if (normalizedMimeType === "application/pdf") return true;

  const cleanName = String(fileName || url || "").split("?")[0].toLowerCase();
  return cleanName.endsWith(".pdf");
};

const buildPreviewDetails = ({
  value,
  rowData,
}: {
  value: string;
  rowData: any;
}): MediaPreviewDetails => {
  const url = getFileUrl(rowData, value);
  const mimeType = String(rowData?.mimeType || "").toLowerCase();
  const fileName = getFieldValue(rowData?.originalFileName) || value.split("/").pop() || "media";
  const previewKind = getMediaPreviewKind({ url, fileName, mimeType });

  return {
    url,
    mimeType,
    fileName,
    previewKind,
    isPdf: isPdfMedia({ mimeType, fileName, url }),
  };
};

const MediaRelativeUriPreview = ({
  value,
  rowData,
  showLabel,
  label,
  setLightboxUrls,
  setOpenLightbox,
}: {
  value: string;
  rowData: any;
  showLabel?: boolean;
  label?: string;
  setLightboxUrls?: any;
  setOpenLightbox?: any;
}) => {
  const [openPdfPreview, setOpenPdfPreview] = useState(false);
  const details = useMemo(() => buildPreviewDetails({ value, rowData }), [value, rowData]);

  const handlePreview = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!details.url) return;

    if (details.previewKind === "image" || details.previewKind === "video") {
      setLightboxUrls?.([
        {
          src: details.url,
          downloadUrl: details.url,
          type: details.previewKind === "video" ? "video" : undefined,
        },
      ]);
      setOpenLightbox?.(true);
      return;
    }

    if (details.isPdf) {
      setOpenPdfPreview(true);
      return;
    }

    openMediaInNewTab(details.url);
  };

  const handleOpenExternal = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!details.url) return;
    openMediaInNewTab(details.url);
  };

  const Icon = details.isPdf ? FileText : details.previewKind === "image" ? ImageIcon : ExternalLink;
  const buttonLabel = details.isPdf
    ? "Preview PDF"
    : details.previewKind === "image"
      ? "Preview image"
      : details.previewKind === "video"
        ? "Preview video"
        : "Open file";
  const hasInlinePreview = details.isPdf || details.previewKind === "image" || details.previewKind === "video";

  return (
    <div className="solid-media-relative-uri-preview">
      {showLabel !== false && label && (
        <p className="form-field-label solid-media-relative-uri-preview__label">{label}</p>
      )}
      <div className="solid-media-relative-uri-preview__content">
        {details.url ? (
          <>
            <SolidButton
              type="button"
              size="sm"
              variant="outline"
              className="solid-media-relative-uri-preview__button"
              tooltip={details.fileName}
              onClick={handlePreview}
            >
              <Icon size={14} aria-hidden />
              <span>{buttonLabel}</span>
            </SolidButton>
            {hasInlinePreview && (
              <SolidButton
                type="button"
                size="sm"
                variant="ghost"
                className="solid-media-relative-uri-preview__external solid-icon-button"
                tooltip="Open in new tab"
                aria-label="Open in new tab"
                onClick={handleOpenExternal}
              >
                <ExternalLink size={14} aria-hidden />
              </SolidButton>
            )}
          </>
        ) : (
          <SolidButton
            type="button"
            size="sm"
            variant="outline"
            className="solid-media-relative-uri-preview__button"
            disabled
          >
            <span>No media</span>
          </SolidButton>
        )}
      </div>

      <SolidDialog
        open={openPdfPreview}
        onOpenChange={setOpenPdfPreview}
        className="solid-confirm-dialog"
        style={{ width: "80vw", maxHeight: "90vh" }}
      >
        <SolidDialogHeader className="p-1 form-wrapper-title">
          <SolidDialogTitle>{details.fileName}</SolidDialogTitle>
          <SolidDialogClose aria-label="Close preview" />
        </SolidDialogHeader>
        <SolidDialogBody className="p-0">
          <div style={{ width: "100%", height: "75vh", overflow: "auto" }}>
            <PDFViewer url={details.url} />
          </div>
        </SolidDialogBody>
      </SolidDialog>
    </div>
  );
};

export const MediaRelativeUriListWidget = ({
  rowData,
  fieldMetadata,
  column,
  setLightboxUrls,
  setOpenLightbox,
}: SolidMediaListFieldWidgetProps) => {
  const fieldName = fieldMetadata.name;
  const value = getFieldValue(rowData?.[fieldName]);

  return (
    <MediaRelativeUriPreview
      value={value}
      rowData={rowData}
      showLabel={false}
      label={column?.attrs?.label ?? fieldMetadata.displayName}
      setLightboxUrls={setLightboxUrls}
      setOpenLightbox={setOpenLightbox}
    />
  );
};

export const MediaRelativeUriFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
  const fieldMetadata = fieldContext?.fieldMetadata;
  const fieldLayoutInfo = fieldContext?.field;
  const fieldName = fieldLayoutInfo?.attrs?.name;
  const value = getFieldValue(formik.values[fieldName]);
  const rowData = {
    ...fieldContext?.data,
    ...formik.values,
  };

  return (
    <MediaRelativeUriPreview
      value={value}
      rowData={rowData}
      showLabel={fieldLayoutInfo?.attrs?.showLabel}
      label={fieldLayoutInfo?.attrs?.label ?? fieldMetadata?.displayName}
      setLightboxUrls={fieldContext?.setLightboxUrls}
      setOpenLightbox={fieldContext?.setOpenLightbox}
    />
  );
};
