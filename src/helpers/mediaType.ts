// Keep these fallback extensions aligned with the supported MEDIA_FILE_TYPES metadata.
const imageExtensions = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "heif"];
// These extensions are supported by the media metadata and should open in the video lightbox
// when the stored MIME type is missing or generic.
const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v", "3g2", "mpeg", "mpg", "mkv", "avi"];
const audioExtensions = ["mp3", "wav", "ogg", "aac", "m4a", "flac", "webm"];

export type MediaKind = "image" | "video" | "audio";
export type MediaPreviewKind = MediaKind | "file";

const getMediaExtension = (value?: string): string => {
  if (!value) return "";

  const cleanValue = value.split("?")[0];
  return cleanValue.split(".").pop()?.toLowerCase() ?? "";
};

const getMediaKind = ({ url, fileName, mimeType }: { url?: string; fileName?: string; mimeType?: string; }): MediaKind | null => {
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

  const extension = getMediaExtension(fileName) || getMediaExtension(url);
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

export const getMediaPreviewKind = ({ url, fileName, mimeType}: { url?: string; fileName?: string; mimeType?: string; }): MediaPreviewKind => {
  return getMediaKind({ url, fileName, mimeType }) ?? "file";
};

export const isLightboxMediaKind = (
  mediaKind: MediaPreviewKind
): mediaKind is "image" | "video" => mediaKind === "image" || mediaKind === "video";

export const getMediaTypeFromUrl = (url?: string): MediaKind => {
  const mediaKind = getMediaKind({ url });
  if (mediaKind === "video" || mediaKind === "audio") {
    return mediaKind;
  }

  return "image";
};
