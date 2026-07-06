export const getPersistedMediaId = (value: unknown): number | string | null => {
  if (!value || value instanceof File || typeof value !== "object") {
    return null;
  }

  const mediaId = (value as { id?: unknown }).id;

  if (typeof mediaId === "number" && Number.isFinite(mediaId)) {
    return mediaId;
  }

  if (typeof mediaId === "string" && mediaId.trim().length > 0) {
    return mediaId;
  }

  return null;
};

export const buildMediaFieldKey = (value: unknown): string => {
  if (value instanceof File) {
    return `local-${value.name}-${value.size}-${value.lastModified}`;
  }

  const persistedMediaId = getPersistedMediaId(value);
  if (persistedMediaId !== null) {
    return `persisted-${persistedMediaId}`;
  }

  if (value && typeof value === "object") {
    const fileName = String(
      (value as { originalFileName?: unknown; name?: unknown }).originalFileName ??
      (value as { name?: unknown }).name ??
      "file"
    );
    const fileSize = String(
      (value as { fileSize?: unknown; size?: unknown }).fileSize ??
      (value as { size?: unknown }).size ??
      "0"
    );

    return `unknown-${fileName}-${fileSize}`;
  }

  return "unknown-file";
};
