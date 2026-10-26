import React, { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import styles from "./SolidAgent.module.css";
import widgetStyles from "./widgets/solidChatWidgets.module.css";
import { normalizeAgentMarkdown, remarkHtmlBreaks } from "./agentMarkdown";

/** Only http(s), mailto and in-app paths are followed; anything else (javascript:, data:) is dropped. */
export function safeHref(href?: string): string | undefined {
    if (!href) return undefined;
    if (/^(https?:|mailto:)/i.test(href) || href.startsWith("/") || href.startsWith("#")) return href;
    return undefined;
}

async function copyText(text: string, done: () => void) {
    try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
        await navigator.clipboard.writeText(text);
        done();
    } catch {
        // Clipboard access may be blocked in an embedded chat.
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            if (document.execCommand("copy")) done();
        } catch {
            // The message remains selectable if the host blocks copying entirely.
        } finally {
            textarea.remove();
        }
    }
}

/** Icon-only copy button (toolbar style), used by the code / diff widgets. */
export function SolidAgentCopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            className={styles.iconBtn}
            aria-label={label ?? "Copy"}
            title={copied ? "Copied" : label ?? "Copy"}
            onClick={(event) => {
                event.stopPropagation();
                void copyText(text, () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                });
            }}
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
}

/** Small copy button shown under a message bubble on hover. */
export function SolidAgentMessageCopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            className={widgetStyles.CopyBtn}
            title="Copy"
            aria-label="Copy message"
            onClick={(event) => {
                event.stopPropagation();
                void copyText(text, () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            }}
        >
            {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
    );
}

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const code = String(children ?? "").replace(/\n$/, "");
    const lang = className?.replace("language-", "") ?? "";
    return (
        <div className={widgetStyles.CodeBlockWrapper}>
            <div className={widgetStyles.CodeBlockHeader}>
                <span className={widgetStyles.CodeLang}>{lang || "code"}</span>
                <button
                    type="button"
                    className={widgetStyles.CodeCopyBtn}
                    onClick={() =>
                        void copyText(code, () => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        })
                    }
                >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className={widgetStyles.CodePre}><code>{code}</code></pre>
        </div>
    );
}

const markdownComponents = {
    code({ className, children, node, ...rest }: any) {
        return <code className={widgetStyles.InlineCode} {...rest}>{children}</code>;
    },
    pre({ children }: any) {
        // Every code block (fenced with or without a language, or indented) is a <pre> around one <code>.
        const code = React.isValidElement(children) ? (children.props as { className?: string; children?: React.ReactNode }) : {};
        return <CodeBlock className={code.className}>{code.children}</CodeBlock>;
    },
    table({ children }: any) {
        return <div className={widgetStyles.MarkdownTableWrapper}><table>{children}</table></div>;
    },
    a({ href, children }: any) {
        const safe = safeHref(href);
        if (!safe) return <span>{children}</span>;
        const external = /^https?:/i.test(safe);
        return (
            <a
                href={safe}
                className={widgetStyles.MarkdownLink}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
            >
                {children}
            </a>
        );
    },
};

const remarkPlugins = [remarkGfm, remarkHtmlBreaks];

/**
 * Markdown for agent text. Raw HTML in the source is never rendered (react-markdown default), except
 * `<br>`, which becomes a line break. Memoized so a streaming reply does not re-parse earlier messages.
 */
export const SolidAgentMarkdown = memo(function SolidAgentMarkdown({ text }: { text: string }) {
    const source = useMemo(() => normalizeAgentMarkdown(text), [text]);
    return (
        <div className={widgetStyles.MarkdownRoot}>
            <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                {source}
            </ReactMarkdown>
        </div>
    );
});
