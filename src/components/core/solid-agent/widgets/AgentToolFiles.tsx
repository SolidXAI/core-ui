import { useState } from "react";
import { FileDown, Image as ImageIcon } from "lucide-react";
import agentStyles from "../SolidAgent.module.css";
import styles from "./solidChatWidgets.module.css";
import { isImageFile } from "../toolFiles";
import type { AgentToolFile } from "../types";

function formatSize(size?: number) {
    if (size === undefined) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Files a tool returned: screenshots as thumbnails, downloads as links. A file shows its name only
 * until SolidX hands out its stored URL.
 */
export function AgentToolFiles({ files }: { files: AgentToolFile[] }) {
    const [preview, setPreview] = useState<AgentToolFile | null>(null);
    return (
        <div className={styles.ToolFiles}>
            {files.map((file, index) => {
                const key = `${file.mediaId ?? file.name}-${index}`;
                const size = formatSize(file.size);
                if (isImageFile(file) && file.url) {
                    return (
                        <button key={key} type="button" className={styles.ToolFileThumb} title={`View ${file.name}`} onClick={() => setPreview(file)}>
                            <img src={file.url} alt={file.name} loading="lazy" />
                        </button>
                    );
                }
                const Icon = isImageFile(file) ? ImageIcon : FileDown;
                const label = <><Icon size={12} aria-hidden="true" /><span className={styles.ToolFileName}>{file.name}</span>{size && <span className={styles.ToolFileSize}>{size}</span>}</>;
                return file.url
                    ? <a key={key} className={styles.ToolFileChip} href={file.url} download={file.name} target="_blank" rel="noreferrer" title={`Download ${file.name}`}>{label}</a>
                    : <span key={key} className={styles.ToolFileChip} title={file.name}>{label}</span>;
            })}
            {preview?.url && (
                <div className={agentStyles.lightbox} role="dialog" aria-label={preview.name} onClick={() => setPreview(null)}>
                    <img src={preview.url} alt={preview.name} />
                </div>
            )}
        </div>
    );
}
