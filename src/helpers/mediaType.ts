const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "avif"];
const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v"];
const audioExtensions = ["mp3", "wav", "m4a", "aac", "oga"];

export type MediaKind = "image" | "video" | "audio";
export type MediaPreviewKind = MediaKind | "file";

// Extracts a lowercase file extension from a URL or filename.
export const getMediaExtension = (value?: string): string => {
  if (!value) return "";

  const cleanValue = value.split("?")[0];
  return cleanValue.split(".").pop()?.toLowerCase() ?? "";
};

// Maps a mime type to a supported media kind when possible.
const getMediaKindFromMimeType = (mimeType?: string): MediaKind | null => {
  const normalizedMimeType = String(mimeType || "").toLowerCase();
  if (normalizedMimeType.startsWith("image/")) {
    return "image";
  }

  if (normalizedMimeType.startsWith("video/")) {
    return "video";
  }

  if (normalizedMimeType.startsWith("audio/")) {
    return "audio";
  }

  return null;
};

// Maps a file extension to a supported media kind when possible.
const getMediaKindFromExtension = (extension?: string): MediaKind | null => {
  if (!extension) return null;

  if (imageExtensions.includes(extension)) {
    return "image";
  }

  if (videoExtensions.includes(extension)) {
    return "video";
  }

  if (audioExtensions.includes(extension)) {
    return "audio";
  }

  return null;
};

// Decides whether a file should be treated as lightbox media or a generic file.
export const getMediaPreviewKind = ({ url, fileName, mimeType}: { url?: string; fileName?: string; mimeType?: string; }): MediaPreviewKind => {
  const mimeKind = getMediaKindFromMimeType(mimeType);
  if (mimeKind) {
    return mimeKind;
  }

  const extensionKind = getMediaKindFromExtension(
    getMediaExtension(fileName) || getMediaExtension(url)
  );

  return extensionKind ?? "file";
};

// Restricts lightbox support to image and video media kinds.
export const isLightboxMediaKind = (
  mediaKind: MediaPreviewKind
): mediaKind is "image" | "video" => mediaKind === "image" || mediaKind === "video";

// Returns the legacy media type used by existing preview consumers.
export const getMediaType = ({url,fileName,mimeType}: { url?: string; fileName?: string; mimeType?: string; }): MediaKind => {
  const previewKind = getMediaPreviewKind({ url, fileName, mimeType });
  if (previewKind === "video" || previewKind === "audio") {
    return previewKind;
  }

  return "image";
};

// Infers the legacy media type from a URL alone.
export const getMediaTypeFromUrl = (url?: string): MediaKind => getMediaType({ url });
