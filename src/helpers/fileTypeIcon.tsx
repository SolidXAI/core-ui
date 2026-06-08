import React from "react";

type FileTypeIconTone = {
    bg: string;
    corner: string;
};

const DEFAULT_FILE_ICON: FileTypeIconTone = {
    bg: "#64748B",
    corner: "#CBD5E1"
};

const FILE_TYPE_ICON_MAP: Record<string, FileTypeIconTone> = {
    pdf: { bg: "#DC2626", corner: "#FCA5A5" },
    txt: { bg: "#475569", corner: "#CBD5E1" },
    doc: { bg: "#2563EB", corner: "#93C5FD" },
    docx: { bg: "#2563EB", corner: "#93C5FD" },
    xls: { bg: "#16A34A", corner: "#86EFAC" },
    xlsx: { bg: "#16A34A", corner: "#86EFAC" },
    csv: { bg: "#059669", corner: "#A7F3D0" },
    ppt: { bg: "#EA580C", corner: "#FDBA74" },
    pptx: { bg: "#EA580C", corner: "#FDBA74" },
    zip: { bg: "#7C3AED", corner: "#C4B5FD" },
    rar: { bg: "#7C3AED", corner: "#C4B5FD" },
    webm: { bg: "#4F46E5", corner: "#A5B4FC" },
    ogg: { bg: "#DB2777", corner: "#F9A8D4" },
    wav: { bg: "#DB2777", corner: "#F9A8D4" }
};

const getFileExtension = (fileUrl: string) => {
    const cleanUrl = fileUrl.split("?")[0];
    return cleanUrl.split(".").pop()?.toLowerCase() ?? "";
};

export const getFileTypeIconTone = (fileUrl: string) => {
    const extension = getFileExtension(fileUrl);
    return FILE_TYPE_ICON_MAP[extension] ?? DEFAULT_FILE_ICON;
};

export const SolidFileTypeIcon = ({ fileUrl, size = 24, className }: { fileUrl: string; size?: number; className?: string }) => {
    const icon = getFileTypeIconTone(fileUrl);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            className={className}
            aria-hidden
        >
            <path
                d="M7.5 2.5h12L26 9v19.5a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2v-24a2 2 0 0 1 2-2Z"
                fill={icon.bg}
            />
            <path
                d="M19.5 2.5V8a1 1 0 0 0 1 1H26L19.5 2.5Z"
                fill={icon.corner}
            />
            <path d="M9.5 12.25h9.5M9.5 15.25h12" stroke="rgba(255,255,255,0.42)" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="7.5" y="18" width="17" height="7.5" rx="1.5" fill="rgba(255,255,255,0.2)" />
        </svg>
    );
};
