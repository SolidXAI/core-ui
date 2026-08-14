// Keep these extension groups in sync with
// `solid-core-module/src/constants/media-file-types.ts` (`IMAGE_EXTENSIONS`,
// `AUDIO_EXTENSIONS`, `VIDEO_EXTENSIONS`, `DOCUMENT_EXTENSIONS`, `PDF_EXTENSION`).
// The UI cannot import those server-side constants directly, so this helper mirrors
// them to keep the file picker aligned with backend validation rules.
const MEDIA_TYPE_TO_EXTENSIONS: Record<string, string[]> = {
    image: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "heif"],
    audio: ["mp3", "wav", "ogg", "aac", "m4a", "flac", "webm"],
    video: ["mp4", "mov", "avi", "mkv", "mpeg", "mpg", "3gp", "3g2", "webm", "ogg"],
    // `file` is intentionally limited to the document/archive set we validate server-side.
    file: ["txt", "md", "csv", "json", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "7z"],
    pdf: ["pdf"],
};

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
    heic: "image/heic",
    heif: "image/heif",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    m4a: "audio/mp4",
    flac: "audio/flac",
    webm: "video/webm",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
    image: "Images",
    audio: "Audio",
    video: "Video",
    file: "Documents and archives",
    pdf: "PDF",
};

export const getAvailableMediaExtensionOptions = (mediaTypes?: string[] | null): Array<{ label: string; value: string }> => {
    return getCategoryExtensions(mediaTypes).map((extension) => ({
        label: `.${extension}`,
        value: extension,
    }));
};

export const normalizeMediaAllowedExtensions = (extensions?: string[] | null): string[] => {
    if (!Array.isArray(extensions)) {
        return [];
    }

    return Array.from(new Set(
        extensions
            .map((extension) => String(extension || "").trim().toLowerCase().replace(/^\./, ""))
            .filter(Boolean)
    ));
};

const getCategoryExtensions = (mediaTypes?: string[] | null): string[] => {
    if (!Array.isArray(mediaTypes) || mediaTypes.length === 0) {
        return [];
    }

    return Array.from(new Set(
        mediaTypes.flatMap((type) => MEDIA_TYPE_TO_EXTENSIONS[String(type || "").toLowerCase()] || [])
    ));
};

const getEffectiveExtensions = (mediaTypes?: string[] | null, mediaAllowedExtensions?: string[] | null): string[] => {
    const categoryExtensions = getCategoryExtensions(mediaTypes);
    const allowedExtensions = normalizeMediaAllowedExtensions(mediaAllowedExtensions);

    if (allowedExtensions.length === 0) {
        return categoryExtensions;
    }

    if (categoryExtensions.length === 0) {
        return allowedExtensions;
    }

    const categoryExtensionSet = new Set(categoryExtensions);
    return allowedExtensions.filter((extension) => categoryExtensionSet.has(extension));
};

export const getAllowedMediaTypesLabel = (mediaTypes?: string[] | null): string => {
    if (!Array.isArray(mediaTypes) || mediaTypes.length === 0) {
        return "Any file";
    }

    const labels = mediaTypes
        .map((type) => MEDIA_TYPE_LABELS[String(type || "").toLowerCase()] || String(type || "").toUpperCase())
        .filter(Boolean);

    return labels.length > 0 ? labels.join(", ") : "Any file";
};

export const getAllowedMediaExtensionsLabel = (mediaTypes?: string[] | null, mediaAllowedExtensions?: string[] | null): string | null => {
    const selectedExtensions = normalizeMediaAllowedExtensions(mediaAllowedExtensions);
    if (selectedExtensions.length === 0) {
        return null;
    }

    const extensions = getEffectiveExtensions(mediaTypes, selectedExtensions);
    if (extensions.length === 0) {
        return null;
    }

    return extensions.map((extension) => `.${extension}`).join(", ");
};

export default function getAcceptedFileTypes(mediaTypes?: string[] | null, mediaAllowedExtensions?: string[] | null) {
    const effectiveExtensions = getEffectiveExtensions(mediaTypes, mediaAllowedExtensions);
    if (effectiveExtensions.length === 0) {
        return {};
    }

    return effectiveExtensions.reduce<Record<string, string[]>>((acceptMap, extension) => {
        const mimeType = EXTENSION_TO_MIME_TYPE[extension] ?? "application/octet-stream";

        if (!acceptMap[mimeType]) {
            acceptMap[mimeType] = [];
        }

        acceptMap[mimeType].push(`.${extension}`);
        return acceptMap;
    }, {});
}
