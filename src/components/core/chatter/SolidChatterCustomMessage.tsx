
import React from 'react'
import DOMPurify from 'dompurify'
import MarkdownViewer from '../../../components/common/MarkdownViewer'
import styles from './chatter.module.css'

interface SolidChatterCustomMessageProps {
    message: string;
}

// react-markdown (no rehype-raw wired in) strips/escapes embedded raw HTML rather than
// rendering it, so a body that's actual HTML (e.g. an imported Odoo audit-log <table>) must be
// rendered separately from Markdown, via the same sanitize-then-dangerouslySetInnerHTML pattern
// SolidRichTextField already uses for rich-text bodies - not routed through MarkdownViewer.
const isHtml = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    return /<\/?[a-z][\s\S]*?>/i.test(text);
};

const isMarkupLanguage = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;

    const markdownPatterns = [
        /^#{1,6}\s+/m,
        /\*\*.*?\*\*/,
        /\*.*?\*/,
        /`.*?`/,
        /```[\s\S]*?```/,
        /^\s*[-*+]\s+/m,
        /^\s*\d+\.\s+/m,
        /\[.*?\]\(.*?\)/,
        /^\s*\|.*\|/m,
        /^\s*>\s+/m,
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
};

export const SolidChatterCustomMessage: React.FC<SolidChatterCustomMessageProps> = ({ message }) => {
    if (isHtml(message)) {
        return (
            <div
                className="custom-message-wrapper"
                // Imported email bodies carry fixed-width tables; scroll inside the bubble instead of widening the panel.
                style={{ maxWidth: '100%', overflowX: 'auto' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }}
            />
        );
    }

    if (isMarkupLanguage(message)) {
        return (
            <div className="custom-message-wrapper">
                <MarkdownViewer data={message} />
            </div>
        );
    }

    return <p className={styles.solidMessageText}>{message}</p>;
};
