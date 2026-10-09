import { useState } from "react";
import { Volume2 } from "lucide-react";
import { SolidFileTypeIcon } from '../../helpers/fileTypeIcon';
import { getMediaFileName, getMediaPreviewKind } from '../../helpers/mediaType';

export const FileReaderExt = ({ fileDetails }: { fileDetails: any }) => {
    const [isPreviewBroken, setIsPreviewBroken] = useState(false);
    const fileUrl = fileDetails?.fileUrl || fileDetails?._full_url;
    const fileName = getMediaFileName(fileDetails);
    const previewKind = getMediaPreviewKind({
        url: fileUrl,
        fileName,
        mimeType: fileDetails?.type || fileDetails?.mimeType,
    });

    if (fileUrl && !isPreviewBroken && previewKind === "image") {
        return <img src={fileUrl} alt={fileName} width={40} height={40} style={{ width: 40, height: 40, flexShrink: 0, objectFit: "cover", borderRadius: 6 }} onError={() => setIsPreviewBroken(true)} />;
    }

    if (fileUrl && !isPreviewBroken && previewKind === "video") {
        return <video src={fileUrl} width={40} height={40} muted preload="metadata" aria-label={fileName} style={{ width: 40, height: 40, flexShrink: 0, objectFit: "cover", borderRadius: 6 }} onError={() => setIsPreviewBroken(true)} />;
    }

    if (previewKind === "audio") {
        return <div aria-label={fileName} style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "#f3f4f6" }}><Volume2 size={18} className="text-gray-600" /></div>;
    }

    return (
        <div style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SolidFileTypeIcon fileUrl={fileUrl || fileName} fileName={fileName} size={40} />
        </div>
    )
}
