/**
 * Pre-render fixes for table mistakes LLMs commonly make, which GFM parses strictly.
 * Fenced code is never touched.
 */

const FENCE = /^\s*(`{3,}|~{3,})(.*)$/;
// A row needs a leading pipe and at least one more; tables without a leading pipe already parse fine.
const ROW = /^ {0,3}\|.*\|/;
const SEPARATOR_CELL = /^\s*:?-+:?\s*$/;
const CODE_SPAN = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g;

/** Splits a table row on unescaped pipes, ignoring the optional outer pipes. */
function splitCells(line: string): string[] {
    let s = line.trim();
    if (s.charAt(0) === "|") s = s.slice(1);
    if (s.length && s.charAt(s.length - 1) === "|" && s.charAt(s.length - 2) !== "\\") s = s.slice(0, -1);
    const cells: string[] = [];
    let current = "";
    for (let i = 0; i < s.length; i++) {
        const ch = s.charAt(i);
        if (ch === "\\" && i + 1 < s.length) {
            current += ch + s.charAt(i + 1);
            i++;
        } else if (ch === "|") {
            cells.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    cells.push(current);
    return cells;
}

function isSeparator(line: string | undefined): boolean {
    if (!line || line.indexOf("|") === -1 || /^ {4,}/.test(line)) return false;
    return splitCells(line).every((cell) => SEPARATOR_CELL.test(cell));
}

function isTableHeader(lines: string[], i: number): boolean {
    return ROW.test(lines[i]) && isSeparator(lines[i + 1]);
}

/** GFM splits cells on every pipe, even inside code spans, unless the pipe is escaped. */
function escapeCodePipes(line: string): string {
    if (line.indexOf("`") === -1) return line;
    return line.replace(CODE_SPAN, (span) => span.replace(/\\?\|/g, (pipe) => (pipe.length === 1 ? "\\|" : pipe)));
}

/** GFM rejects the whole table when the separator's column count differs from the header's. */
function fixSeparator(line: string, columns: number): string {
    const cells = splitCells(line);
    if (cells.length === columns) return line;
    const indent = /^\s*/.exec(line)![0];
    const fixed: string[] = [];
    for (let i = 0; i < columns; i++) fixed.push(i < cells.length ? cells[i].trim() : "---");
    return `${indent}| ${fixed.join(" | ")} |`;
}

/**
 * - Starts a table on its own block, so it is not swallowed by a preceding list item.
 * - Escapes pipes inside inline code on table rows.
 * - Drops blank lines between rows of one table.
 * - Pads or trims the separator row to the header's column count.
 */
export function normalizeAgentMarkdown(markdown: string): string {
    if (markdown.indexOf("|") === -1) return markdown;
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const out: string[] = [];
    let fence: { char: string; size: number } | null = null;
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fenceMatch = FENCE.exec(line);
        if (fence) {
            if (fenceMatch && fenceMatch[1].charAt(0) === fence.char && fenceMatch[1].length >= fence.size && !fenceMatch[2].trim()) {
                fence = null;
            }
            out.push(line);
            continue;
        }
        if (fenceMatch) {
            fence = { char: fenceMatch[1].charAt(0), size: fenceMatch[1].length };
            inTable = false;
            out.push(line);
            continue;
        }

        if (inTable) {
            if (ROW.test(line) && !isTableHeader(lines, i)) {
                out.push(escapeCodePipes(line));
                continue;
            }
            if (!line.trim()) {
                let next = i;
                while (next < lines.length && !lines[next].trim()) next++;
                if (next < lines.length && ROW.test(lines[next]) && !isTableHeader(lines, next)) {
                    i = next - 1;
                    continue;
                }
            }
            inTable = false;
        }

        if (isTableHeader(lines, i)) {
            const header = escapeCodePipes(line);
            // An indented table belongs to the list item above it; leave its placement alone.
            if (!/^\s/.test(header) && out.length && out[out.length - 1].trim()) out.push("");
            out.push(header, fixSeparator(lines[i + 1], splitCells(header).length));
            inTable = true;
            i++;
            continue;
        }

        out.push(line);
    }
    return out.join("\n");
}

type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[] };

const BR_TAG = /^<br\s*\/?>$/i;

function replaceBreaks(node: MarkdownNode) {
    const children = node.children;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === "html" && BR_TAG.test((child.value ?? "").trim())) children[i] = { type: "break" };
        else replaceBreaks(child);
    }
}

/** Remark plugin: renders `<br>` as a line break (LLMs use it inside table cells) while other raw HTML stays escaped. */
export function remarkHtmlBreaks() {
    return (tree: MarkdownNode) => {
        replaceBreaks(tree);
    };
}
