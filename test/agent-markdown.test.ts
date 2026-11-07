import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeAgentMarkdown, remarkHtmlBreaks } from "../src/components/core/solid-agent/agentMarkdown.ts";

// node --experimental-strip-types --test test/agent-markdown.test.ts

const render = (markdown: string) =>
    renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkHtmlBreaks] }, normalizeAgentMarkdown(markdown)));
const tableCount = (html: string) => (html.match(/<table>/g) ?? []).length;
const TABLE = "| Name | Type |\n|---|---|\n| id | int |";

describe("normalizeAgentMarkdown", () => {
    it("leaves text without tables unchanged", () => {
        const text = "# Title\n\n- a\n- b\n\n```ts\nconst x = 1;\n```";
        assert.equal(normalizeAgentMarkdown(text), text);
    });

    it("starts a table after a list on its own block", () => {
        const html = render(`- a\n- b\n${TABLE}`);
        assert.equal(tableCount(html), 1);
        assert.match(html, /<li>b<\/li>\s*<\/ul>\s*<table>/);
    });

    it("keeps an indented table inside its list item", () => {
        const html = render("1. Item\n   | A | B |\n   |---|---|\n   | 1 | 2 |");
        assert.match(html, /<li>Item\s*<table>/);
    });

    it("keeps pipes inside inline code within one cell", () => {
        const html = render("| Field | Example |\n|---|---|\n| filter | `a || b` |");
        assert.match(html, /<td><code>a \|\| b<\/code><\/td>/);
    });

    it("joins rows split by blank lines but keeps separate tables apart", () => {
        assert.equal(tableCount(render("| A | B |\n|---|---|\n| 1 | 2 |\n\n| 3 | 4 |")), 1);
        assert.match(render("| A | B |\n|---|---|\n| 1 | 2 |\n\n| 3 | 4 |"), /<td>3<\/td>/);
        assert.equal(tableCount(render("| A |\n|---|\n| 1 |\n\n| B |\n|---|\n| 2 |")), 2);
    });

    it("repairs a separator with the wrong column count", () => {
        const html = render("| A | B | C |\n|---|---|\n| 1 | 2 | 3 |");
        assert.equal(tableCount(html), 1);
        assert.match(html, /<th>C<\/th>/);
        assert.equal(tableCount(render("| A |\n|:--|---|\n| 1 |")), 1);
    });

    it("handles CRLF line endings", () => {
        assert.equal(tableCount(render(`- a\r\n${TABLE.replace(/\n/g, "\r\n")}`)), 1);
    });

    it("does not touch tables inside fenced code", () => {
        const text = "```\n- a\n| A |\n|---|---|\n| `x|y` |\n\n| 2 |\n```";
        assert.equal(normalizeAgentMarkdown(text), text);
    });
});

describe("remarkHtmlBreaks", () => {
    it("renders <br> in a table cell as a line break", () => {
        assert.match(render("| A |\n|---|\n| one<br>two<br/>three |"), /<td>one<br\/>\s*two<br\/>\s*three<\/td>/);
    });

    it("keeps other raw HTML escaped", () => {
        const html = render("| A |\n|---|\n| <script>alert(1)</script> <img src=x onerror=alert(1)> |");
        assert.doesNotMatch(html, /<script|<img/);
    });
});
