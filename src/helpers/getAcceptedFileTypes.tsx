export type MediaConfig = {
    mediaFileTypeDefinitions?: Array<{
        mediaType: string;
        mimeType: string;
        extension: string;
    }>;
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
    image: "Images",
    audio: "Audio",
    video: "Video",
    file: "Documents and archives",
    pdf: "PDF",
};

const normalizeExtensions = (extensions?: string[] | null): string[] => Array.from(
    new Set(
        (Array.isArray(extensions) ? extensions : [])
            .map((extension) => String(extension || "").trim().toLowerCase().replace(/^\./, ""))
            .filter(Boolean)
    )
);

const normalizeMediaTypes = (mediaTypes?: string[] | null): string[] => Array.from(
    new Set(
        (Array.isArray(mediaTypes) ? mediaTypes : [])
            .map((type) => String(type || "").trim().toLowerCase())
            .filter(Boolean)
    )
);

const getCategoryExtensions = (mediaTypes?: string[] | null, mediaFileTypeDefinitions?: MediaConfig["mediaFileTypeDefinitions"] | null): string[] => {
    const allowedMediaTypes = new Set(normalizeMediaTypes(mediaTypes));
    if (allowedMediaTypes.size === 0) {
        return [];
    }

    return normalizeExtensions(
        (mediaFileTypeDefinitions ?? [])
            .filter((fileType) => allowedMediaTypes.has(String(fileType?.mediaType || "").toLowerCase()))
            .map((fileType) => String(fileType?.extension || "").trim().toLowerCase())
    );
};

export const getAvailableMediaExtensionOptions = (mediaTypes?: string[] | null, mediaFileTypeDefinitions?: MediaConfig["mediaFileTypeDefinitions"] | null): Array<{ label: string; value: string }> => {
    return getCategoryExtensions(mediaTypes, mediaFileTypeDefinitions).map((extension) => ({
        label: `.${extension}`,
        value: extension,
    }));
};

export const getAllowedMediaTypesLabel = (mediaTypes?: string[] | null): string => {
    const normalizedMediaTypes = normalizeMediaTypes(mediaTypes);
    if (normalizedMediaTypes.length === 0) {
        return "Any file";
    }

    const labels = normalizedMediaTypes.map(
        (type) => MEDIA_TYPE_LABELS[type] || type.toUpperCase()
    );

    return labels.length > 0 ? labels.join(", ") : "Any file";
};

export const getAllowedMediaExtensionsLabel = (mediaAllowedExtensions?: string[] | null): string | null => {
    const selectedExtensions = normalizeExtensions(mediaAllowedExtensions);
    if (selectedExtensions.length === 0) {
        return null;
    }

    return selectedExtensions.map((extension) => `.${extension}`).join(", ");
};

export default function getAcceptedFileTypes(mediaTypes?: string[] | null, mediaAllowedExtensions?: string[] | null, mediaConfig?: MediaConfig | null) {
    const effectiveExtensions = normalizeExtensions(mediaAllowedExtensions);
    if (effectiveExtensions.length > 0) {
        return {
            "application/octet-stream": effectiveExtensions.map((extension) => `.${extension}`),
        };
    }

    const normalizedMediaTypes = normalizeMediaTypes(mediaTypes);
    if (normalizedMediaTypes.length === 0) {
        return {};
    }

    const categoryExtensions = getCategoryExtensions(mediaTypes, mediaConfig?.mediaFileTypeDefinitions);
    const allowedExtensions = categoryExtensions.map((extension) => `.${extension}`);
    const acceptGroups: string[] = [];

    if (normalizedMediaTypes.includes("image")) acceptGroups.push("image/*");
    if (normalizedMediaTypes.includes("audio")) acceptGroups.push("audio/*");
    if (normalizedMediaTypes.includes("video")) acceptGroups.push("video/*");
    if (normalizedMediaTypes.includes("pdf")) acceptGroups.push("application/pdf");
    if (normalizedMediaTypes.includes("file")) acceptGroups.push("application/*", "text/*");

    if (acceptGroups.length === 0) {
        return {};
    }

    return acceptGroups.reduce<Record<string, string[]>>((acceptMap, acceptGroup) => {
        acceptMap[acceptGroup] = allowedExtensions;
        return acceptMap;
    }, {});
}
