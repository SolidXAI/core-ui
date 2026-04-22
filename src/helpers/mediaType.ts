const videoExtensions = ["mp4", "webm", "ogg", "mov", "m4v"];
const audioExtensions = ["mp3", "wav", "m4a", "aac", "oga"];

export type MediaKind = "image" | "video" | "audio";

export const getMediaTypeFromUrl = (url?: string): MediaKind => {
  if (!url) return "image";

  const cleanUrl = url.split("?")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase();

  if (!ext) return "image";

  if (videoExtensions.includes(ext)) {
    return "video";
  }

  if (audioExtensions.includes(ext)) {
    return "audio";
  }

  return "image";
};
