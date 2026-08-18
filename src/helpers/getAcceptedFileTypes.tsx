const MEDIA_TYPE_LABELS: Record<string, string> = {
    image: "Images",
    audio: "Audio",
    video: "Video",
    file: "Documents and archives",
    pdf: "PDF",
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

const getCategoryExtensions = ( mediaTypes?: string[] | null, mediaTypeExtensions?: Record<string, string[]> | null): string[] => {
    const extensionMap = mediaTypeExtensions ?? {};
    if (!Array.isArray(mediaTypes) || mediaTypes.length === 0) {
        return [];
    }

    return Array.from(new Set(
        mediaTypes.flatMap((type) => extensionMap[String(type || "").toLowerCase()] || [])
    ));
};

export const getAvailableMediaExtensionOptions = (mediaTypes?: string[] | null, mediaTypeExtensions?: Record<string, string[]> | null): Array<{ label: string; value: string }> => {
    return getCategoryExtensions(mediaTypes, mediaTypeExtensions).map((extension) => ({
        label: `.${extension}`,
        value: extension,
    }));
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

export const getAllowedMediaExtensionsLabel = ( mediaAllowedExtensions?: string[] | null): string | null => {
    const selectedExtensions = normalizeMediaAllowedExtensions(mediaAllowedExtensions);
    if (selectedExtensions.length === 0) {
        return null;
    }

    return selectedExtensions.map((extension) => `.${extension}`).join(", ");
};

export default function getAcceptedFileTypes(mediaTypes?: string[] | null, mediaAllowedExtensions?: string[] | null) {
    // Frontend filtering should follow the explicit per-field extension restriction.
    // Backend remains the real validator, but keeping the picker aligned avoids obvious mistakes.
    const effectiveExtensions = normalizeMediaAllowedExtensions(mediaAllowedExtensions);
    if (effectiveExtensions.length === 0) {
        return {};
    }

    const normalizedMediaTypes = new Set(
        Array.isArray(mediaTypes)
            ? mediaTypes.map((type) => String(type || "").toLowerCase()).filter(Boolean)
            : []
    );

    const acceptGroups: string[] = [];
    if (normalizedMediaTypes.has("image")) acceptGroups.push("image/*");
    if (normalizedMediaTypes.has("audio")) acceptGroups.push("audio/*");
    if (normalizedMediaTypes.has("video")) acceptGroups.push("video/*");
    if (normalizedMediaTypes.has("pdf")) acceptGroups.push("application/pdf");
    if (normalizedMediaTypes.has("file")) {
        acceptGroups.push("application/*", "text/*");
    }

    if (acceptGroups.length === 0) {
        return {};
    }

    const extensions = effectiveExtensions.map((extension) => `.${extension}`);
    return acceptGroups.reduce<Record<string, string[]>>((acceptMap, acceptGroup) => {
        acceptMap[acceptGroup] = extensions;
        return acceptMap;
    }, {});
}
