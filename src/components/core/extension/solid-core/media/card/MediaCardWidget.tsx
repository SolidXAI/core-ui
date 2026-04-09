import { SolidKanbanCardWidgetProps } from "../../../../../../types/solid-core";

const renderText = (value: any, fallback = "--") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const formatFileSize = (value: any) => {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) return "--";
  if (size >= 1024 * 1024 * 1024) return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};

const toTitleCase = (value: any) => {
  const text = renderText(value, "");
  if (!text) return "--";
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getFileUrl = (rowData: any) => {
  return rowData?._full_url || rowData?.fileUrl || rowData?.relativeUri || "";
};

const getMimeType = (rowData: any) => {
  return String(rowData?.mimeType || "").toLowerCase();
};

const isImage = (mimeType: string) => mimeType.startsWith("image/");
const isVideo = (mimeType: string) => mimeType.startsWith("video/");
const isAudio = (mimeType: string) => mimeType.startsWith("audio/");

const getExtension = (rowData: any) => {
  const fileName = renderText(rowData?.originalFileName, "");
  const raw = fileName.split(".").pop();
  return raw ? raw.toUpperCase() : "FILE";
};

export default function MediaCardWidget({
  rowData,
  setLightboxUrls,
  setOpenLightbox,
}: SolidKanbanCardWidgetProps) {
  const fileUrl = getFileUrl(rowData);
  const mimeType = getMimeType(rowData);
  const fileName = renderText(rowData?.originalFileName, "Untitled file");
  const providerName = renderText(rowData?.mediaStorageProviderMetadata?.displayName, "Unknown provider");
  const modelName = renderText(rowData?.modelMetadata?.displayName, "Unknown model");
  const fieldName = renderText(rowData?.fieldMetadata?.displayName, "Unknown field");
  const mimeLabel = mimeType ? mimeType.split("/")[0].toUpperCase() : "FILE";
  const showPreview = isImage(mimeType) || isVideo(mimeType);

  const handlePreviewClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!fileUrl) return;

    if (showPreview) {
      setLightboxUrls?.([{ src: fileUrl, downloadUrl: fileUrl }]);
      setOpenLightbox?.(true);
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="solid-media-card-widget">
      <div className="solid-media-card-widget__preview" onClick={handlePreviewClick}>
        {fileUrl && isImage(mimeType) && (
          <img
            src={fileUrl}
            alt={fileName}
            className="solid-media-card-widget__image"
          />
        )}
        {fileUrl && isVideo(mimeType) && (
          <video
            src={fileUrl}
            className="solid-media-card-widget__image"
            muted
          />
        )}
        {(!fileUrl || (!isImage(mimeType) && !isVideo(mimeType))) && (
          <div className="solid-media-card-widget__file-fallback">
            <span className="solid-media-card-widget__file-ext">{getExtension(rowData)}</span>
            <span className="solid-media-card-widget__file-type">{mimeLabel}</span>
          </div>
        )}

        <div className="solid-media-card-widget__topline">
          <span className="solid-media-card-widget__chip">{mimeLabel}</span>
          <span className="solid-media-card-widget__size">{formatFileSize(rowData?.fileSize)}</span>
        </div>
      </div>

      <div className="solid-media-card-widget__body">
        <div className="solid-media-card-widget__title" title={fileName}>
          {fileName}
        </div>
        <div className="solid-media-card-widget__subtitle" title={renderText(rowData?.mimeType, "Unknown mime type")}>
          {renderText(rowData?.mimeType, "Unknown mime type")}
        </div>

        <div className="solid-media-card-widget__meta">
          <div className="solid-media-card-widget__meta-item">
            <span className="solid-media-card-widget__meta-label">Model</span>
            <span className="solid-media-card-widget__meta-value" title={modelName}>{modelName}</span>
          </div>
          <div className="solid-media-card-widget__meta-item">
            <span className="solid-media-card-widget__meta-label">Field</span>
            <span className="solid-media-card-widget__meta-value" title={fieldName}>{fieldName}</span>
          </div>
          <div className="solid-media-card-widget__meta-item">
            <span className="solid-media-card-widget__meta-label">Provider</span>
            <span className="solid-media-card-widget__meta-value" title={providerName}>{providerName}</span>
          </div>
          <div className="solid-media-card-widget__meta-item">
            <span className="solid-media-card-widget__meta-label">Entity</span>
            <span className="solid-media-card-widget__meta-value">#{renderText(rowData?.entityId)}</span>
          </div>
        </div>

        <div className="solid-media-card-widget__footer">
          <span className="solid-media-card-widget__record-id">Media #{renderText(rowData?.id)}</span>
          <span className="solid-media-card-widget__kind">{toTitleCase(mimeLabel)}</span>
        </div>
      </div>
    </div>
  );
}
