import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { SolidAgentCopyButton } from "../SolidAgentMarkdown";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";

type DiffFile = { path: string; diff?: string; additions?: number; deletions?: number };
type DiffListData = { title?: string; files?: DiffFile[] };

function countChanges(diff = "") {
    let additions = 0;
    let deletions = 0;
    diff.split("\n").forEach((line) => {
        if (line.startsWith("+") && !line.startsWith("+++")) additions++;
        else if (line.startsWith("-") && !line.startsWith("---")) deletions++;
    });
    return { additions, deletions };
}

function diffLineClass(line: string) {
    if (line.startsWith("@@")) return styles.diffLineHunk;
    if (line.startsWith("+")) return styles.diffLineAdd;
    if (line.startsWith("-")) return styles.diffLineDel;
    return "";
}

/**
 * `event_data: { widget: "diff-list", title?, files: [{ path, diff, additions?, deletions? }] }`.
 * Codex-style file list, collapsed by default, with copy per file and for all files.
 */
export const SolidDiffListChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<DiffListData>(eventData);
    const files = asArray<DiffFile>(data.files);
    const [open, setOpen] = useState<Set<number>>(new Set());
    const allDiffs = files.map((file) => `--- ${file.path}\n${file.diff ?? ""}`).join("\n\n");

    const toggle = (index: number) =>
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });

    return (
        <div className={styles.card}>
            <div className={styles.cardHead}>
                <span style={{ flex: 1 }}>{data.title ?? `${files.length} file${files.length === 1 ? "" : "s"} changed`}</span>
                <SolidAgentCopyButton text={allDiffs} label="Copy all diffs" />
            </div>
            {files.map((file, index) => {
                const counts = file.additions != null || file.deletions != null
                    ? { additions: file.additions ?? 0, deletions: file.deletions ?? 0 }
                    : countChanges(file.diff);
                const expanded = open.has(index);
                return (
                    <div key={`${file.path}-${index}`}>
                        <button type="button" className={styles.fileRow} aria-expanded={expanded} onClick={() => toggle(index)}>
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className={styles.fileName}>{file.path}</span>
                            <span className={styles.diffAdd}>+{counts.additions}</span>
                            <span className={styles.diffDel}>−{counts.deletions}</span>
                        </button>
                        {expanded && (
                            <div style={{ position: "relative" }}>
                                <div style={{ position: "absolute", right: 6, top: 4 }}>
                                    <SolidAgentCopyButton text={file.diff ?? ""} label={`Copy ${file.path}`} />
                                </div>
                                <pre className={styles.diff}>
                                    {(file.diff ?? "").split("\n").map((line, i) => (
                                        <span key={i} className={`${styles.diffLine} ${diffLineClass(line)}`}>{line || " "}</span>
                                    ))}
                                </pre>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
